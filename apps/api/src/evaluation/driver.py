#!/usr/bin/env python3

import argparse
import json
import os
import subprocess
import tempfile
import shutil
import sys
from pathlib import Path

import psycopg2

ISOLATE_BIN = '/usr/local/bin/isolate'
BOX_ID = 0
BASE_DIR = '/tmp/codi_eval'

LANGUAGE_PY = 'Python 3 / CPython'
LANGUAGE_CPP = 'C++20 / g++'


def get_task_config(cms_task_id: int, language: str):
    dsn = os.environ.get('DATABASE_URL', 'postgresql://cmsuser@localhost/cmsdb')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT d.time_limit, d.memory_limit, d.id
            FROM public.datasets d
            WHERE d.task_id = %s AND d.description = 'Default'
        """, (cms_task_id,))
        row = cur.fetchone()
        if not row:
            raise RuntimeError(f'No Default dataset for task {cms_task_id}')
        time_limit, memory_limit_bytes, dataset_id = row
        memory_limit_kb = memory_limit_bytes // 1024 if memory_limit_bytes else 262144

        # Fetch managers (graders) for this dataset
        grader_filename = 'grader.py' if 'Python' in language else 'grader.cpp'
        cur.execute("""
            SELECT m.digest
            FROM public.managers m
            WHERE m.dataset_id = %s AND m.filename = %s
        """, (dataset_id, grader_filename))
        grader_row = cur.fetchone()
        grader_content = None
        if grader_row:
            cur.execute("SELECT encode(lo_get(f.loid), 'escape') FROM public.fsobjects f WHERE f.digest = %s",
                        (grader_row[0],))
            r = cur.fetchone()
            if r and r[0]:
                grader_content = r[0]

        cur.execute("""
            SELECT t.codename, t.input, t.output
            FROM public.testcases t
            WHERE t.dataset_id = %s ORDER BY t.codename
        """, (dataset_id,))
        testcases = []
        for codename, input_digest, output_digest in cur.fetchall():
            def read_lo(digest):
                cur.execute("SELECT lo_get(f.loid) FROM public.fsobjects f WHERE f.digest = %s", (digest,))
                r = cur.fetchone()
                return bytes(r[0]) if r and r[0] else b''

            testcases.append({
                'codename': codename,
                'input': read_lo(input_digest) if input_digest else b'',
                'output': read_lo(output_digest) if output_digest else b'',
            })
        return {
            'time_limit': float(time_limit) if time_limit else 1.0,
            'memory_limit_kb': memory_limit_kb,
            'testcases': testcases,
            'grader_content': grader_content,
        }
    finally:
        cur.close()
        conn.close()


def prepare_submission(language: str, source_path: str, work_dir: Path, grader_content: str | None):
    if grader_content:
        if 'Python' in language:
            src_file = work_dir / 'solution.py'
            shutil.copy2(source_path, src_file)
            grader_file = work_dir / 'grader.py'
            grader_file.write_text(grader_content)
            for f in [src_file, grader_file]:
                proc = subprocess.run(['/usr/bin/python3', '-m', 'compileall', '-b', str(f)],
                                     capture_output=True, text=True, timeout=30)
                if proc.returncode != 0:
                    raise RuntimeError(f'Compilation failed:\n{proc.stderr}')
            import re
            m = re.search(r'from solution import (\w+)', grader_content)
            func_name = m.group(1) if m else None
            if func_name:
                import ast
                with open(src_file) as f:
                    tree = ast.parse(f.read())
                has_func = any(
                    isinstance(n, ast.FunctionDef) and n.name == func_name
                    for n in ast.walk(tree)
                )
                if not has_func:
                    raise RuntimeError(
                        f'Submission must define the function "{func_name}"'
                    )
            return src_file, grader_file

        if 'C++' in language:
            src_file = work_dir / 'solution.cpp'
            shutil.copy2(source_path, src_file)
            grader_file = work_dir / 'grader.cpp'
            grader_file.write_text(grader_content)
            exe = work_dir / 'a.out'
            proc = subprocess.run(
                ['/usr/bin/g++', '-std=gnu++20', '-O2', '-pipe', '-static',
                 '-s', '-o', str(exe), str(grader_file), str(src_file)],
                capture_output=True, text=True, timeout=30,
            )
            if proc.returncode != 0:
                raise RuntimeError(f'Compilation failed:\n{proc.stderr}')
            return src_file, exe

        raise RuntimeError(f'Unsupported language with grader: {language}')

    # No grader — run submission as a standalone program
    ext = '.py' if 'Python' in language else '.cpp' if 'C++' in language else '.c' if language == 'C11 / gcc' else '.java'
    src_file = work_dir / f'source{ext}'
    shutil.copy2(source_path, src_file)

    if 'Python' in language:
        proc = subprocess.run(['/usr/bin/python3', '-m', 'compileall', '-b', '.'],
                              capture_output=True, text=True, cwd=str(work_dir), timeout=30)
        if proc.returncode != 0:
            raise RuntimeError(f'Compilation failed:\n{proc.stderr}')
        executable = work_dir / '__main__.pyc'
        pyc = src_file.with_suffix('.pyc')
        if pyc.exists():
            pyc.rename(executable)
        return src_file, executable

    if 'C++' in language:
        exe = work_dir / 'a.out'
        proc = subprocess.run(
            ['/usr/bin/g++', '-std=gnu++20', '-O2', '-pipe', '-static',
             '-s', '-o', str(exe), str(src_file)],
            capture_output=True, text=True, timeout=30,
        )
        if proc.returncode != 0:
            raise RuntimeError(f'Compilation failed:\n{proc.stderr}')
        return src_file, exe

    raise RuntimeError(f'Unsupported language: {language}')


def eval_command(language: str, executable: Path, grader_content: str | None):
    if grader_content and 'Python' in language:
        return ['/usr/bin/python3', 'grader.py']
    if 'Python' in language:
        return ['/usr/bin/python3', executable.name]
    return ['./a.out']


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--language', required=True)
    parser.add_argument('--source-file', required=True)
    parser.add_argument('--task-id', type=int, required=True)
    args = parser.parse_args()

    task_config = get_task_config(args.task_id, args.language)
    grader_content = task_config['grader_content']

    os.makedirs(BASE_DIR, exist_ok=True)
    work_dir = Path(tempfile.mkdtemp(dir=BASE_DIR))

    try:
        src_file, executable = prepare_submission(args.language, args.source_file, work_dir, grader_content)

        # Init isolate box
        subprocess.run([ISOLATE_BIN, f'--box-id={BOX_ID}', '--init'],
                       capture_output=True, timeout=10)
        box_root = Path(f'/var/local/lib/isolate/{BOX_ID}/box')

        # Copy all needed files into the box
        for f in work_dir.iterdir():
            if f.name.endswith(('.py', '.pyc', '.cpp', '.out')):
                shutil.copy2(f, box_root / f.name)

        eval_cmd = eval_command(args.language, executable, grader_content)

        correct_count = 0
        total = len(task_config['testcases'])
        results = []

        for tc in task_config['testcases']:
            proc = subprocess.run(
                [ISOLATE_BIN, f'--box-id={BOX_ID}', '--run',
                 f'--time={task_config["time_limit"]}',
                 f'--mem={task_config["memory_limit_kb"]}',
                 '--processes=5'] + eval_cmd,
                input=tc['input'],
                capture_output=True,
                timeout=int(task_config['time_limit']) + 30,
            )

            user_output = proc.stdout

            expected = tc['output'].strip()
            actual = user_output.strip()
            passed = (actual == expected)

            if passed:
                correct_count += 1
            results.append({
                'codename': tc['codename'],
                'outcome': 'correct' if passed else 'wrong',
                'passed': passed,
            })

        score = (correct_count / total * 100) if total > 0 else 0
        status = 'ACCEPTED' if correct_count == total else 'WRONG_ANSWER'
        print(json.dumps({'ok': True, 'status': status, 'score': score, 'results': results}))

    except RuntimeError as e:
        print(json.dumps({'ok': False, 'error': str(e), 'status': 'COMPILATION_ERROR', 'score': 0}))
    except subprocess.TimeoutExpired:
        print(json.dumps({'ok': False, 'error': 'Execution timed out', 'status': 'TIME_LIMIT_EXCEEDED', 'score': 0}))
    except Exception as e:
        print(json.dumps({'ok': False, 'error': str(e), 'status': 'RUNTIME_ERROR', 'score': 0}))
    finally:
        subprocess.run([ISOLATE_BIN, f'--box-id={BOX_ID}', '--cleanup'],
                       capture_output=True, timeout=10)
        shutil.rmtree(work_dir, ignore_errors=True)


if __name__ == '__main__':
    main()
