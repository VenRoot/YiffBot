export class PermissionDeniedError extends Error {
    constructor() {
        super("Permission denied");
        this.name = "PermissionDeniedError";
    }
}

export class GetFileError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "GetFileError";
    }
}

export class NotAFileError extends Error {
    constructor() {
        super("Path is not a file");
        this.name = "NotAFileError";
    }
}

export class EmptyFileError extends Error {
    constructor() {
        super("File is empty");
        this.name = "EmptyFileError";
    }
}

export class EmptyDirectoryError extends Error {
    constructor() {
        super("Directory is empty");
        this.name = "EmptyDirectoryError";
    }
}

export class AnyError extends Error {
    constructor(object: NodeJS.ErrnoException) {
        super(object.message);
        this.name = object.name;
        this.cause = object.cause;
        this.message = object.message;
        this.stack = object.stack;
    }
}

export class InvalidStatusCode extends Error {
    constructor(link: string, statusCode?: number) {
        super(`Request ${link} Failed with ${statusCode ?? 0}`);
    }
}

export class NotDirectMessageError extends Error {
    constructor() {
        super("Not a direct message");
        this.name = "NotDirectMessageError";
    }
}

export class NoReplyToDocumentError extends Error {
    constructor() {
        super("No reply to document");
        this.name = "NoReplyToDocumentError";
    }
}

export class AlreadyExistsError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AlreadyExistsError";
    }
}

export class NoCaptionError extends Error {
    constructor() {
        super("No caption given");
        this.name = "NoCaptionError";
    }
}

export class NoMessageError extends Error {
    constructor() {
        super("No message given");
        this.name = "NoMessageError";
    }
}

export class MissingParamsError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "MissingParamsError";
    }
}

export class InvalidParamsError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "InvalidParamsError";
    }
}

export class OutOfRetiesError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "OutOfRetiesError";
    }
}

export class DBError extends Error {
    public type: DBAction;
    constructor(erroObj: any, type: DBAction) {
        super(erroObj);
        this.type = type;
        this.name = "DBError";
    }
}

type DBAction = "store" | "get" | "delete" | "update";