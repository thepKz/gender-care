export class UnauthorizedError extends Error {
    constructor(message: string = 'Không có quyền truy cập') {
        super(message);
        this.name = 'UnauthorizedError';
    }
} 