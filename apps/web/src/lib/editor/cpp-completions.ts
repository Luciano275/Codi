export const CPP_KEYWORDS = [
  'auto', 'bool', 'break', 'case', 'catch', 'char', 'class', 'const',
  'constexpr', 'continue', 'default', 'delete', 'do', 'double', 'else',
  'enum', 'explicit', 'extern', 'false', 'float', 'for', 'friend',
  'goto', 'if', 'include', 'inline', 'int', 'long', 'namespace',
  'new', 'noexcept', 'nullptr', 'operator', 'override', 'private',
  'protected', 'public', 'register', 'return', 'short', 'signed',
  'sizeof', 'static', 'struct', 'switch', 'template', 'this', 'throw',
  'true', 'try', 'typedef', 'typename', 'union', 'unsigned', 'using',
  'virtual', 'void', 'volatile', 'while',
];

export const CPP_STDLIB_FUNCTIONS = [
  'std::cin', 'std::cout', 'std::cerr', 'std::clog',
  'std::endl', 'std::setw', 'std::setprecision',
  'std::vector', 'std::map', 'std::set', 'std::unordered_map',
  'std::unordered_set', 'std::stack', 'std::queue',
  'std::string', 'std::pair', 'std::tuple',
  'std::sort', 'std::reverse', 'std::find', 'std::binary_search',
  'std::lower_bound', 'std::upper_bound', 'std::min', 'std::max',
  'std::abs', 'std::swap', 'std::accumulate',
  'std::make_pair', 'std::make_tuple',
  'std::to_string', 'std::stoi', 'std::stoll', 'std::stof',
];

export const CPP_SNIPPETS: Array<{ label: string; detail: string; insertText: string }> = [
  { label: 'main', detail: 'int main()', insertText: 'int main() {\n    ${1:return 0;}\n}' },
  { label: 'for', detail: 'For loop', insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3:}\n}' },
  { label: 'foreach', detail: 'Range-based for', insertText: 'for (auto ${1:item} : ${2:container}) {\n    ${3:}\n}' },
  { label: 'while', detail: 'While loop', insertText: 'while (${1:condition}) {\n    ${2:}\n}' },
  { label: 'if', detail: 'If statement', insertText: 'if (${1:condition}) {\n    ${2:}\n}' },
  { label: 'else', detail: 'If-else', insertText: 'if (${1:condition}) {\n    ${2:}\n} else {\n    ${3:}\n}' },
  { label: 'vector', detail: 'std::vector', insertText: 'std::vector<${1:int}> ${2:v};' },
  { label: 'cout', detail: 'std::cout <<', insertText: 'std::cout << ${1:value} << std::endl;' },
  { label: 'cin', detail: 'std::cin >>', insertText: 'std::cin >> ${1:variable};' },
  { label: 'struct', detail: 'Struct definition', insertText: 'struct ${1:Name} {\n    ${2:}\n};' },
  { label: 'class', detail: 'Class definition', insertText: 'class ${1:Name} {\npublic:\n    ${2:}\n};' },
  { label: 'include', detail: '#include directive', insertText: '#include <${1:iostream}>' },
  { label: 'using', detail: 'Using namespace std', insertText: 'using namespace std;' },
  { label: 'typedef', detail: 'Type alias', insertText: 'typedef ${1:int} ${2:new_type};' },
  { label: 'auto', detail: 'Auto variable', insertText: 'auto ${1:var} = ${2:value};' },
];
