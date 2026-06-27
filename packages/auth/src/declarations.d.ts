declare module 'bcryptjs' {
  export function compareSync(data: string, hash: string): boolean;
  export function hashSync(data: string, salt: string | number): string;
}
