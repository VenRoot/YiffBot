class X implements Disposable {
    public s: string;
    constructor(str: string) {
        this.s = str;
    }

    [Symbol.dispose]() {
        console.log("Disposing", this.s);
        return Promise.resolve();
    }
}

function f() {
    using x = new X("hello");
    console.log(x.s);
}