import { Request } from "express";

export interface Signature {
    username: string | null;
    authorIpv4: string | null;
    authorIpv6: string | null;
}

export function createSignature(username: string | null, req: Request): Signature {
    const raw = req.socket.remoteAddress ?? '';
    const ipv4 = raw.startsWith('::ffff:') ? raw.slice(7) : null;
    const ipv6 = !raw.startsWith('::ffff:') ? raw : null;

    return {
        username: username,
        authorIpv4: ipv4,
        authorIpv6: ipv6,
    };
}