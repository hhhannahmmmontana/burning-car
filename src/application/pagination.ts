
export function encodeToken(lastId: number): string {
    return Buffer.from(String(lastId)).toString('base64');
}

export function decodeToken(token: string | null): number {
    if (token == null) return 0;
    const id = Number(Buffer.from(token, 'base64').toString('utf-8'));
    if (isNaN(id)) return 0;
    return id;
}