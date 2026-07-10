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

# Whitespace chars for white-diff (Unicode White_Space in ASCII range)
_WHITE_CHARS = [b' ', b'\t', b'\n', b'\x0b', b'\x0c', b'\r']
_MAX_FSIZE_KB = 1024 * 1024  # 1 GiB


def _white_diff_canonicalize(s: bytes) -> bytes:
    for c in _WHITE_CHARS[1:]:
        s = s.replace(c, _WHITE_CHARS[0])
    return _WHITE_CHARS[0].join(x for x in s.split(_WHITE_CHARS[0]) if x)


def _white_diff(output: bytes, expected: bytes) -> bool:
    while True:
        idx_out = output.find(b'\n')
        lout = output[:idx_out + 1] if idx_out >= 0 else output
        output = output[idx_out + 1:] if idx_out >= 0 else b''

        idx_exp = expected.find(b'\n')
        lexp = expected[:idx_exp + 1] if idx_exp >= 0 else expected
        expected = expected[idx_exp + 1:] if idx_exp >= 0 else b''

        both_done = len(lout) == 0 and len(lexp) == 0
        one_done = len(lout) == 0 or len(lexp) == 0

        if both_done:
            return True
        if one_done:
            all_white = b''.join(_WHITE_CHARS)
            if lout.strip(all_white) or lexp.strip(all_white):
                return False
        else:
            if _white_diff_canonicalize(lout) != _white_diff_canonicalize(lexp):
                return False


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

        grader_filename = 'grader.py' if 'Python' in language else 'grader.cpp'
        cur.execute("""
            SELECT m.digest
            FROM public.managers m
            WHERE m.dataset_id = %s AND m.filename = %s
        """, (dataset_id, grader_filename))
        grader_row = cur.fetchone()
        grader_content = None
        if grader_row:
            cur.execute("SELECT lo_get(f.loid) FROM public.fsobjects f WHERE f.digest = %s",
                        (grader_row[0],))
            r = cur.fetchone()
            if r and r[0]:
                blob = bytes(r[0])
                grader_content = blob.decode('utf-8')

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
                ['/usr/bin/g++', '-DEVAL', '-std=gnu++20', '-O2', '-pipe', '-static',
                 '-s', '-o', str(exe), str(grader_file), str(src_file),
                 '-lm'],
                capture_output=True, text=True, timeout=30,
            )
            if proc.returncode != 0:
                raise RuntimeError(f'Compilation failed:\n{proc.stderr}')
            return src_file, exe

        raise RuntimeError(f'Unsupported language with grader: {language}')

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
            ['/usr/bin/g++', '-DEVAL', '-std=gnu++20', '-O2', '-pipe', '-static',
             '-s', '-o', str(exe), str(src_file), '-lm'],
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


def parse_meta(path: Path) -> dict:
    meta = {}
    if path.exists():
        with open(path) as f:
            for line in f:
                if ':' in line:
                    k, v = line.strip().split(':', 1)
                    meta[k.strip()] = v.strip()
    return meta


def get_exit_status(meta: dict) -> str:
    status_list = meta.get('status', '')
    if 'XX' in status_list:
        return 'SANDBOX_ERROR'
    elif 'TO' in status_list:
        if 'message' in meta and 'wall' in meta['message']:
            return 'TIMEOUT_WALL'
        return 'TIMEOUT'
    elif 'SG' in status_list:
        return 'SIGNAL'
    elif 'RE' in status_list:
        return 'NONZERO_RETURN'
    return 'OK'


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

        subprocess.run([ISOLATE_BIN, f'--box-id={BOX_ID}', '--init', '--cg'],
                       capture_output=True, timeout=10)

        box_root = Path(f'/var/local/lib/isolate/{BOX_ID}/box')

        for f in work_dir.iterdir():
            if f.name.endswith(('.py', '.pyc', '.cpp', '.out')):
                shutil.copy2(f, box_root / f.name)

        eval_cmd = eval_command(args.language, executable, grader_content)

        correct_count = 0
        total = len(task_config['testcases'])
        results = []

        for tc in task_config['testcases']:
            input_file = f'input_{tc["codename"]}.txt'
            output_file = f'output_{tc["codename"]}.txt'
            stderr_file = f'stderr_{tc["codename"]}.txt'

            (box_root / input_file).write_bytes(tc['input'])

            meta_file = work_dir / f'meta_{tc["codename"]}.txt'

            proc = subprocess.run(
                [ISOLATE_BIN, f'--box-id={BOX_ID}', '--run',
                 '--cg',
                 f'--time={task_config["time_limit"]}',
                 f'--wall-time={2 * task_config["time_limit"] + 1}',
                 f'--cg-mem={task_config["memory_limit_kb"]}',
                 f'--fsize={_MAX_FSIZE_KB}',
                 f'--meta={meta_file}',
                 f'--stdin={input_file}',
                 f'--stdout={output_file}',
                 f'--stderr={stderr_file}',
                 '--processes=5'] + eval_cmd,
                capture_output=True,
                timeout=int(task_config['time_limit'] * 3) + 30,
            )

            meta = parse_meta(meta_file)
            exit_status = get_exit_status(meta)

            if exit_status == 'TIMEOUT' or exit_status == 'TIMEOUT_WALL':
                results.append({
                    'codename': tc['codename'],
                    'outcome': 'time-limit',
                    'passed': False,
                    'reason': 'Límite de tiempo excedido',
                })
            elif exit_status == 'SIGNAL':
                sig = meta.get('exitsig', '0')
                oom_killed = meta.get('cg-oom-killed', '0')
                if oom_killed == '1':
                    results.append({
                        'codename': tc['codename'],
                        'outcome': 'memory-limit',
                        'passed': False,
                        'reason': 'Límite de memoria excedido',
                    })
                else:
                    results.append({
                        'codename': tc['codename'],
                        'outcome': 'runtime-error',
                        'passed': False,
                        'reason': f'Error de ejecución (señal {sig})',
                    })
            elif exit_status == 'NONZERO_RETURN':
                results.append({
                    'codename': tc['codename'],
                    'outcome': 'runtime-error',
                    'passed': False,
                    'reason': 'Error de ejecución (código de retorno no cero)',
                })
            elif exit_status == 'SANDBOX_ERROR':
                results.append({
                    'codename': tc['codename'],
                    'outcome': 'runtime-error',
                    'passed': False,
                    'reason': 'Error interno del sandbox',
                })
            else:
                out_path = box_root / output_file
                user_output = out_path.read_bytes() if out_path.exists() else b''
                expected = tc['output']
                passed = _white_diff(user_output, expected)
                if passed:
                    correct_count += 1
                results.append({
                    'codename': tc['codename'],
                    'outcome': 'correct' if passed else 'wrong',
                    'passed': passed,
                })
            for fname in [input_file, output_file, stderr_file]:
                (box_root / fname).unlink(missing_ok=True)

        time_exceeded = any(r.get('outcome') == 'time-limit' for r in results)
        mem_exceeded = any(r.get('outcome') == 'memory-limit' for r in results)
        runtime_errors = any(r.get('outcome') == 'runtime-error' for r in results)

        if time_exceeded:
            status = 'TIME_LIMIT_EXCEEDED'
        elif mem_exceeded:
            status = 'MEMORY_LIMIT_EXCEEDED'
        elif runtime_errors:
            status = 'RUNTIME_ERROR'
        elif correct_count == total:
            status = 'ACCEPTED'
        else:
            status = 'WRONG_ANSWER'

        score = (correct_count / total * 100) if total > 0 else 0
        print(json.dumps({'ok': True, 'status': status, 'score': score, 'results': results}))

    except RuntimeError as e:
        print(json.dumps({'ok': False, 'error': str(e), 'status': 'COMPILATION_ERROR', 'score': 0}))
    except subprocess.TimeoutExpired:
        print(json.dumps({'ok': False, 'error': 'Execution timed out', 'status': 'TIME_LIMIT_EXCEEDED', 'score': 0}))
    except Exception as e:
        print(json.dumps({'ok': False, 'error': str(e), 'status': 'RUNTIME_ERROR', 'score': 0}))
    finally:
        subprocess.run([ISOLATE_BIN, f'--box-id={BOX_ID}', '--cleanup', '--cg'],
                       capture_output=True, timeout=10)
        shutil.rmtree(work_dir, ignore_errors=True)


if __name__ == '__main__':
    main()
