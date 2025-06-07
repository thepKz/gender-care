export class NotFoundError extends Error {
    constructor(message: string = 'Không tìm thấy tài nguyên') {
        super(message);
        this.name = 'NotFoundError';
    }
} 