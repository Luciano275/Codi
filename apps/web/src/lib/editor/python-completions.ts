export const PYTHON_KEYWORDS = [
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
  'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
  'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
  'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return',
  'try', 'while', 'with', 'yield',
];

export const PYTHON_BUILTINS = [
  'abs', 'all', 'any', 'bin', 'bool', 'bytearray', 'bytes', 'chr',
  'complex', 'dict', 'dir', 'divmod', 'enumerate', 'eval', 'exec',
  'filter', 'float', 'format', 'frozenset', 'getattr', 'globals',
  'hasattr', 'hash', 'help', 'hex', 'id', 'input', 'int', 'isinstance',
  'issubclass', 'iter', 'len', 'list', 'locals', 'map', 'max',
  'memoryview', 'min', 'next', 'object', 'oct', 'open', 'ord', 'pow',
  'print', 'property', 'range', 'repr', 'reversed', 'round', 'set',
  'setattr', 'slice', 'sorted', 'staticmethod', 'str', 'sum', 'super',
  'tuple', 'type', 'vars', 'zip', '__import__',
];

export const PYTHON_SNIPPETS: Array<{ label: string; detail: string; insertText: string }> = [
  { label: 'def', detail: 'Define function', insertText: 'def ${1:name}(${2:args}):\n    ${3:pass}' },
  { label: 'class', detail: 'Define class', insertText: 'class ${1:Name}:\n    def __init__(self):\n        ${2:pass}' },
  { label: 'for', detail: 'For loop', insertText: 'for ${1:item} in ${2:items}:\n    ${3:pass}' },
  { label: 'while', detail: 'While loop', insertText: 'while ${1:condition}:\n    ${2:pass}' },
  { label: 'if', detail: 'If statement', insertText: 'if ${1:condition}:\n    ${2:pass}' },
  { label: 'elif', detail: 'Elif statement', insertText: 'elif ${1:condition}:\n    ${2:pass}' },
  { label: 'else', detail: 'Else statement', insertText: 'else:\n    ${1:pass}' },
  { label: 'try', detail: 'Try block', insertText: 'try:\n    ${1:pass}\nexcept ${2:Exception} as e:\n    ${3:pass}' },
  { label: 'with', detail: 'With block', insertText: 'with ${1:open} as ${2:var}:\n    ${3:pass}' },
  { label: 'print', detail: 'Print to console', insertText: 'print(${1:value})' },
  { label: 'ifmain', detail: 'if __name__ block', insertText: 'if __name__ == \'__main__\':\n    ${1:main()}' },
  { label: 'listcomp', detail: 'List comprehension', insertText: '[${1:expr} for ${2:item} in ${3:items}]' },
  { label: 'lambda', detail: 'Lambda function', insertText: 'lambda ${1:args}: ${2:expr}' },
  { label: 'import', detail: 'Import module', insertText: 'import ${1:module}' },
  { label: 'from', detail: 'Import from module', insertText: 'from ${1:module} import ${2:name}' },
];
