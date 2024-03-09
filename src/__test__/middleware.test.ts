process.env.DB_PASS = "xxxx";
process.env.DB_HOST = "xxxx";
process.env.DB_NAME = "xxxx";
process.env.DB_PORT = "xxxx";
process.env.DB_USER = "xxxx";

import { Context } from "grammy";
import * as middleware from "../modules/middleware";
import * as core from "../core";
import { createPrivateCTX, createGroupCTX, createSupergroupCTX } from "./ctx.helper";
import fs, { FileHandle } from "fs/promises";
import mariadb, { queryMock } from "../__mocks__/mariadb";
import { PathLike, mkdir } from "fs";
import * as special from "../special";
import * as media from "../modules/media";
import type { directories, mediaCounts } from "../modules/media";
import { downloadFile } from "../modules/file/downloadFile";
import { EmptyFileError } from "../modules/exceptions";

jest.mock("grammy", () => ({
  ...jest.requireActual("grammy"),
  Bot: class {
    constructor(token: string) {
    }
    start = jest.fn();
    on = jest.fn();
    api = {
        call: jest.fn(),
        sendMessage: jest.fn().mockImplementation(async (chatId, text) => {}),
        sendPhoto: jest.fn().mockImplementation(async (chatId, text) => {}),
        sendAnimation: jest.fn().mockImplementation(async (chatId, text) => {}),
        sendVideo: jest.fn().mockImplementation(async (chatId, text) => {}),
        getFile: jest.fn().mockImplementation(async (fileId) => {
            return { file_path: fileId };
        })
    }
},
InputFile: class {
    constructor(file: string) {
    }
}
}));

jest.mock('fs/promises', () => ({
  readdir: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  unlink: jest.fn(),
  stat: jest.fn(),
  mkdir: jest.fn(),
  ...jest.requireActual('fs/promises'),
}));


const fsReadFileMock = (_path: PathLike | FileHandle) => {
  if(_path.toString().endsWith("modmed.json")) return Promise.resolve(Buffer.from(JSON.stringify([{
    file: "test.jpg",
    caption: "TEST"
  }])));

  else return Promise.resolve(Buffer.from("INVALID FILE"));
}
const fsReadFileMockEmptyFile = (_path: PathLike | FileHandle) => {
  // console.warn(_path);

  if(_path.toString().endsWith("modmed.json")) return Promise.resolve(Buffer.from(JSON.stringify([{
    file: "test.jpg",
    caption: "TEST"
  }])));

  else return Promise.resolve(Buffer.from(""));
};

const files = [
  "test.jpg",
  "test.gif",
  "test.mp4",
  "test2.jpg",
  "test2.gif",
  "test2.mp4",
  "test3.jpg",
  "test3.gif",
  "test3.mp4",
  "test4.jpg",
  "test4.gif",
  "test4.mp4",
  "test5.jpg",
  "test5.gif",
  "test5.mp4",
]

describe("caption", () => {
    describe('successful tests', () => { 
        let ctx: Partial<Context>;
        let replySpy: jest.SpyInstance;
        let checkAdminSpy: jest.SpyInstance;
        let reportErrorSpy: jest.SpyInstance;
        let fsReadFileSpy: jest.SpyInstance;
        let fsWriteFileSpy: jest.SpyInstance;
        beforeAll(() => {
          ctx = createPrivateCTX(
            "/addmodmed This is a test message",
            1,
            1,
            1,
            "Test",
            undefined,
            undefined,
            undefined,
            {
              reply_to_message_id: 2,
              photo: [{ file_id: "INVALID", file_unique_id: "INVALID", height: 0, width: 0 }],
            }
          );
          replySpy = jest.spyOn(ctx, "reply");
          fsReadFileSpy = jest.spyOn(fs, "readFile").mockResolvedValue(Buffer.from("[]"));
          fsWriteFileSpy = jest.spyOn(fs, "writeFile").mockResolvedValue();
          checkAdminSpy = jest.spyOn(core, "checkAdmin").mockResolvedValue(true);
          reportErrorSpy = jest.spyOn(core, "ReportError");
        });
      
        afterAll(() => {
          replySpy.mockRestore();
          checkAdminSpy.mockRestore();
          reportErrorSpy.mockRestore();
          fsReadFileSpy.mockRestore();
        })
      
        it("Should add a caption", async () => {
          middleware.caption(ctx as Context);
          expect(replySpy).not.toHaveBeenCalled();
          expect(reportErrorSpy).not.toHaveBeenCalled();
        });
    });

    describe('Error handling', () => { 
        let replySpy: jest.SpyInstance;
        let checkAdminSpy: jest.SpyInstance;
        let reportErrorSpy: jest.SpyInstance;
        let fsReadFileSpy: jest.SpyInstance;
        let fsWriteFileSpy: jest.SpyInstance;
        let fsReaddirSpy: jest.SpyInstance;
        beforeEach(() => {
          fsReadFileSpy = jest.spyOn(fs, "readFile").mockResolvedValue(Buffer.from("[]"));
          fsReaddirSpy = jest.spyOn(fs, "readdir").mockResolvedValue(files as any);
          fsWriteFileSpy = jest.spyOn(fs, "writeFile").mockResolvedValue();
          checkAdminSpy = jest.spyOn(core, "checkAdmin").mockResolvedValue(true);
          reportErrorSpy = jest.spyOn(core, "ReportError");
        });

        afterEach(() => {
          replySpy.mockClear();
          checkAdminSpy.mockClear();
          reportErrorSpy.mockClear();
          fsReadFileSpy.mockClear();
          fsWriteFileSpy.mockClear();
        })
      
        afterAll(() => {
          replySpy.mockRestore();
          fsReaddirSpy.mockRestore();
          checkAdminSpy.mockRestore();
          reportErrorSpy.mockRestore();
          fsReadFileSpy.mockRestore();
          fsWriteFileSpy.mockRestore();
        })
      
        it("Should throw an error if no caption is provided", async () => {
            const ctx = createPrivateCTX(
                "/addmodmed",
                1,
                1,
                1,
                "Test",
                undefined,
                undefined,
                undefined,
                {
                  reply_to_message_id: 2,
                  photo: [{ file_id: "INVALID", file_unique_id: "INVALID", height: 0, width: 0 }],
                }
              );
          replySpy = jest.spyOn(ctx, "reply");
          await middleware.caption(ctx as Context);
          expect(replySpy).toHaveBeenCalledWith("No caption given");
          expect(reportErrorSpy).not.toHaveBeenCalled();
        });

        it("Should throw an error if not in pm", async () => {
            const ctx = createSupergroupCTX(
                "/addmodmed This is a test message",
                1,
                1,
                1,
                "Test",
                undefined,
                undefined,
                undefined,
                undefined,
              );
          replySpy = jest.spyOn(ctx, "reply");
          await middleware.caption(ctx as Context);
          expect(replySpy).toHaveBeenCalledWith("This command can only be used in direct messages");
          expect(reportErrorSpy).not.toHaveBeenCalled();
        
        });

        it("Should throw an error if not replying to a media", async () => {
            const ctx = createPrivateCTX(
                "/addmodmed This is a test message",
                1,
                1,
                1,
                "Test",
                undefined,
                undefined,
                undefined,
                undefined,
              );
          replySpy = jest.spyOn(ctx, "reply");
          await middleware.caption(ctx as Context);
          expect(replySpy).toHaveBeenCalledWith("Please reply to a media to add it to the caption list");
          expect(reportErrorSpy).not.toHaveBeenCalled();
        });


        it("Should throw an error if not an admin", async () => {
            const ctx = createPrivateCTX(
                "/addmodmed This is a test message",
                1,
                1,
                1,
                "Test",
                undefined,
                undefined,
                undefined,
                {
                  reply_to_message_id: 2,
                  photo: [{ file_id: "INVALID", file_unique_id: "INVALID", height: 0, width: 0 }],
                }
              );
          replySpy = jest.spyOn(ctx, "reply");
          checkAdminSpy = jest.spyOn(core, "checkAdmin").mockResolvedValue(false);
          await middleware.caption(ctx as Context);
          expect(replySpy).toHaveBeenCalledWith("You are not allowed to use this command");
          expect(reportErrorSpy).not.toHaveBeenCalled();
        });

        it("Should throw an error if an unknown error occurs", async () => {
            const ctx = createPrivateCTX(
                "/addmodmed This is a test message",
                1,
                1,
                1,
                "Test",
                undefined,
                undefined,
                undefined,
                {
                  reply_to_message_id: 2,
                  photo: [{ file_id: "INVALID", file_unique_id: "INVALID", height: 0, width: 0 }],
                }
              );
          replySpy = jest.spyOn(ctx, "reply");
          fsWriteFileSpy = jest.spyOn(fs, "writeFile").mockRejectedValue(new Error("Unknown error"));
          await middleware.caption(ctx as Context);
          expect(replySpy).not.toHaveBeenCalled();
          expect(reportErrorSpy).toHaveBeenCalled();
        })
    })
});

describe('start', () => { 
    let ctx: Partial<Context>;
    ctx = createPrivateCTX(
        "/addmodmed This is a test message",
        1,
        1,
        1,
        "Test",
        undefined,
        undefined,
        undefined,
        {
          reply_to_message_id: 2,
          photo: [{ file_id: "INVALID", file_unique_id: "INVALID", height: 0, width: 0 }],
        }
      );

    it("Should send a message", async () => {
        const replySpy = jest.spyOn(ctx, "reply");
        middleware.start(ctx as Context);
        expect(replySpy).toHaveBeenCalled();
    });
});


//TODO: Refactor this test suite into more describes, so the mocks are not setup in the actual test
describe('sendman', () => {
    describe("successful tests", () => {
        let ctx: Partial<Context>;
        let replySpy: jest.SpyInstance;
        let fsReadFileSpy: jest.SpyInstance;
        let mkdirSpy: jest.SpyInstance;
        let readDirSpy: jest.SpyInstance;
        let checkAdminSpy: jest.SpyInstance;
        let fsStatSpy: jest.SpyInstance;
        let fsUnlinkSpy: jest.SpyInstance;
        beforeAll(() => {
          queryMock.mockResolvedValue([]);
          ctx = createPrivateCTX(
            "/sendman",
            1,
            1,
            1,
            "Test",
            undefined,
            undefined,
            undefined,
            undefined
          );
          readDirSpy = jest.spyOn(fs, "readdir").mockResolvedValue(files as any);
          mkdirSpy = jest.spyOn(fs, "mkdir").mockResolvedValue(undefined);
          replySpy = jest.spyOn(ctx, "reply");
          fsReadFileSpy = jest.spyOn(fs, "readFile").mockImplementation(fsReadFileMock);
          fsStatSpy = jest.spyOn(fs, "stat").mockResolvedValue({isFile: () => true, size: BigInt(1)} as any);
          fsUnlinkSpy = jest.spyOn(fs, "unlink").mockResolvedValue(undefined);
            
        });

        afterEach(() => {
          queryMock.mockClear();
          readDirSpy.mockClear();
          mkdirSpy.mockClear();
          replySpy.mockClear();
          fsReadFileSpy.mockClear();
          fsStatSpy.mockClear();
        });

        beforeEach(() => {
          checkAdminSpy = jest.spyOn(core, "checkAdmin").mockResolvedValue(true);
        })
      
        afterAll(() => {
          checkAdminSpy.mockRestore();
          queryMock.mockClear();
          readDirSpy.mockRestore();
          replySpy.mockRestore();
          fsReadFileSpy.mockRestore();
          mkdirSpy.mockRestore();
          fsStatSpy.mockRestore();
          fsUnlinkSpy.mockRestore();
        })
      
        it("Should send a normal media", async () => {
          await middleware.sendman(ctx as Context);
          expect(replySpy).not.toHaveBeenCalled();
        });

        it("Should send a christmas media", async () => {
          ctx = createPrivateCTX(
            "/sendman christmas",
            1,
            1,
            1,
            "Test",
            undefined,
            undefined,
            undefined,
            undefined
          );
          await middleware.sendman(ctx as Context);
          expect(replySpy).not.toHaveBeenCalled();
        });

        it("Should send a newyears media", async () => {
          ctx = createPrivateCTX(
            "/sendman newyear",
            1,
            1,
            1,
            "Test",
            undefined,
            undefined,
            undefined,
            undefined
          );
          await middleware.sendman(ctx as Context);
          expect(replySpy).not.toHaveBeenCalled();
        });
    });


    describe("error handling", () => {
      let replySpy: jest.SpyInstance;
      let fsReadFileSpy: jest.SpyInstance;
      let mkdirSpy: jest.SpyInstance;
      let readDirSpy: jest.SpyInstance;
      let checkAdminSpy: jest.SpyInstance;
      let fsStatSpy: jest.SpyInstance;
      let fsUnlinkSpy: jest.SpyInstance;

    beforeEach(() => {
      mkdirSpy = jest.spyOn(fs, "mkdir").mockResolvedValue(undefined);
      fsReadFileSpy = jest.spyOn(fs, "readFile").mockImplementation(fsReadFileMock);
      readDirSpy = jest.spyOn(fs, "readdir").mockResolvedValue(files as any);
      checkAdminSpy = jest.spyOn(core, "checkAdmin").mockResolvedValue(true);
      fsStatSpy = jest.spyOn(fs, "stat").mockResolvedValue({isFile: () => true, size: BigInt(1)} as any);
      fsUnlinkSpy = jest.spyOn(fs, "unlink").mockResolvedValue(undefined);
    });

    afterAll(() => {
      mkdirSpy.mockRestore();
      readDirSpy.mockRestore();
      fsReadFileSpy.mockRestore();
      checkAdminSpy.mockRestore();
      fsStatSpy.mockRestore();
      fsUnlinkSpy.mockRestore();
    });

    afterEach(() => {
      queryMock.mockClear();
      readDirSpy.mockClear();
      mkdirSpy.mockClear();
      replySpy.mockClear();
      fsReadFileSpy.mockClear();
      fsStatSpy.mockClear();
    })

    it("Should throw an error if no message is provided", () => {
      const ctx = createPrivateCTX(
        "/sendman",
        1,
        1,
        1,
        "Test",
        undefined,
        undefined,
        undefined,
        undefined
      );
      //@ts-ignore
      ctx.message = undefined;
      replySpy = jest.spyOn(ctx, "reply");
      middleware.sendman(ctx as Context).then(() => {
        expect(replySpy).toHaveBeenCalledWith("No message object recieved-");
      })
    });

    it("Should throw an error if permission is denied", () => {
      const ctx = createPrivateCTX(
        "/sendman",
        1,
        1,
        1,
        "Test",
        undefined,
        undefined,
        undefined,
        undefined
      );
      replySpy = jest.spyOn(ctx, "reply");
      checkAdminSpy = jest.spyOn(core, "checkAdmin").mockResolvedValue(false);

      middleware.sendman(ctx as Context).then(() => {
        expect(replySpy).toHaveBeenCalledWith("You are not allowed to use this command");
      })
    });
    it("Should throw an error if invalid params are provided", () => {
      const params = "sjdisdjis";
      const ctx = createPrivateCTX(
        `/sendman ${params}`,
        1,
        1,
        1,
        "Test",
        undefined,
        undefined,
        undefined,
        undefined
      );
      replySpy = jest.spyOn(ctx, "reply");
      middleware.sendman(ctx as Context).then(() => {
        expect(replySpy).toHaveBeenCalledWith(`Invalid params. Usage: /sendman <newyear | christmas | normal>? | Your input: ${params}`);
        replySpy.mockRestore();
      })
    });

    it.skip("Should throw an error if the file is empty", async () => {
      const ctx = createPrivateCTX(
        "/sendman",
        1,
        1,
        1,
        "Test",
        undefined,
        undefined,
        undefined,
        undefined
      );
      replySpy = jest.spyOn(ctx, "reply");
      fsReadFileSpy = jest.spyOn(fs, "readFile").mockImplementation(fsReadFileMockEmptyFile);
      await middleware.sendman(ctx as Context);
      expect(fsUnlinkSpy).toHaveBeenCalledTimes(1);
      expect(fsReadFileSpy).toHaveBeenCalledTimes(2);
      expect(replySpy).toHaveBeenCalledWith("Error: File is empty");
      replySpy.mockRestore();

    });

    it("Should throw an error if the directory is empty", async () => {
      const ctx = createPrivateCTX(
        "/sendman",
        1,
        1,
        1,
        "Test",
        undefined,
        undefined,
        undefined,
        undefined
      );
      replySpy = jest.spyOn(ctx, "reply");
      readDirSpy = jest.spyOn(fs, "readdir").mockResolvedValue([]);
      await middleware.sendman(ctx as Context);
      expect(replySpy).toHaveBeenCalledWith("Error: Directory is empty");
      replySpy.mockRestore();
    });

    it("Should throw an error if fs.stat fails 5 times", async () => {
      const ctx = createPrivateCTX(
        "/sendman",
        1,
        1,
        1,
        "Test",
        undefined,
        undefined,
        undefined,
        undefined
      );
      replySpy = jest.spyOn(ctx, "reply");
      fsStatSpy = jest.spyOn(fs, "stat").mockRejectedValue(new Error("Test"));
      readDirSpy = jest.spyOn(fs, "readdir").mockResolvedValue(files as any);
      await middleware.sendman(ctx as Context);
      expect(replySpy).toHaveBeenCalledWith("Error: Out of retries: 5");
      replySpy.mockRestore();
    })

    it("Should throw an error if the database is throwing errors", async () => {
      const ctx = createPrivateCTX(
        "/sendman",
        1,
        1,
        1,
        "Test",
        undefined,
        undefined,
        undefined,
        undefined
      );
      replySpy = jest.spyOn(ctx, "reply");
      const reportErrorSpy = jest.spyOn(core, "ReportError").mockImplementation(() => Promise.resolve())
      queryMock.mockRejectedValue(new Error("Test"));
      await middleware.sendman(ctx as Context);
      expect(reportErrorSpy).toHaveBeenCalled();
      expect(replySpy).not.toHaveBeenCalled();
      replySpy.mockRestore();
    })
  });
});


describe("PING", () => {
  let replySpy: jest.SpyInstance;
  beforeAll(() => {
    replySpy = jest.fn();
  });
  afterAll(() => {
    replySpy?.mockRestore();
  });
  it("Should reply with pong", () => {
    const ctx = createPrivateCTX(
      "/ping",
      1,
      1,
      1,
      "Test",
      undefined,
      undefined,
      undefined,
      undefined
    );
    replySpy = jest.spyOn(ctx, "reply");
    middleware.ping(ctx as Context);
    expect(replySpy).toHaveBeenCalledWith("Pong!");
  });
});


describe('version', () => {
  let replySpy: jest.SpyInstance;
  let versionTemp: string | undefined;


  beforeAll(() => {
    versionTemp = process.env.VERSION;
    process.env.VERSION = "1.0.0";
  });


  afterAll(() => {
    replySpy?.mockRestore();
    process.env.VERSION = versionTemp;
  });

  it('Should return the version', () => {
    const ctx = createPrivateCTX(
      "/version",
      1,
      1,
      1,
      "Test",
      undefined,
      undefined,
      undefined,
      undefined
    );
    replySpy = jest.spyOn(ctx, "reply");
    middleware.version(ctx as Context);
    expect(replySpy).toHaveBeenCalledWith("Version: 1.0.0");
  });
});


describe('setMethod', () => {
  describe('successful tests', () => {
    let checkAdminSpy: jest.SpyInstance;

    beforeAll(() => {
      checkAdminSpy = jest.spyOn(core, "checkAdmin").mockResolvedValue(true);
    });

    afterAll(() => {
      checkAdminSpy.mockRestore();
    })

    it("Should set the method to normal", async () => {
      const ctx = createPrivateCTX(
        "/setmethod",
        1,
        1,
        1,
        "Test",
        undefined,
        undefined,
        undefined,
        undefined
      );

      await middleware.setMethod(ctx as Context);
      expect(special.special.normal).toBe(true);
      expect(special.special.newyear).toBe(false);
      expect(special.special.christmas).toBe(false);
    });

    it("Should set the method to christmas", async () => {
      const ctx = createPrivateCTX(
        "/setmethod christmas",
        1,
        1,
        1,
        "Test",
        undefined,
        undefined,
        undefined,
        undefined
      );

      await middleware.setMethod(ctx as Context);
      expect(special.special.normal).toBe(false);
      expect(special.special.newyear).toBe(false);
      expect(special.special.christmas).toBe(true);
    });

    it("Should set the method to newyear", async () => {
      const ctx = createPrivateCTX(
        "/setmethod newyear",
        1,
        1,
        1,
        "Test",
        undefined,
        undefined,
        undefined,
        undefined
      );

      await middleware.setMethod(ctx as Context);
      expect(special.special.normal).toBe(false);
      expect(special.special.newyear).toBe(true);
      expect(special.special.christmas).toBe(false);
    });
  });

  describe('error handling', () => {
    let checkAdminSpy: jest.SpyInstance;
    let replySpy: jest.SpyInstance;

    beforeEach(() => {
      checkAdminSpy = jest.spyOn(core, "checkAdmin").mockResolvedValue(true);
    });

    afterEach(() => {
      checkAdminSpy.mockClear();
      replySpy.mockClear();
    });

    afterAll(() => {
      checkAdminSpy.mockRestore();
      replySpy.mockRestore();
    });

    it("Should throw an error if no message is provided", async () => {
      const ctx = createPrivateCTX(
        "/setmethod",
        1,
        1,
        1,
        "Test",
        undefined,
        undefined,
        undefined,
        undefined
      );
      //@ts-ignore
      ctx.message = undefined;
      replySpy = jest.spyOn(ctx, "reply");
      await middleware.setMethod(ctx as Context);
      expect(replySpy).toHaveBeenCalledWith("No message object recieved-");
    });

    it("Should throw an error if permission is denied", async () => {
      const ctx = createPrivateCTX(
        "/setmethod",
        1,
        1,
        1,
        "Test",
        undefined,
        undefined,
        undefined,
        undefined
      );
      replySpy = jest.spyOn(ctx, "reply");
      checkAdminSpy = jest.spyOn(core, "checkAdmin").mockResolvedValue(false);

      await middleware.setMethod(ctx as Context);
      expect(replySpy).toHaveBeenCalledWith("You are not allowed to use this command");
    });

    it("Should throw an error if invalid params are provided", async () => {
      const params = "sjdisdjis";
      const ctx = createPrivateCTX(
        `/setmethod ${params}`,
        1,
        1,
        1,
        "Test",
        undefined,
        undefined,
        undefined,
        undefined
      );
      replySpy = jest.spyOn(ctx, "reply");
      await middleware.setMethod(ctx as Context);
      expect(replySpy).toHaveBeenCalledWith(`Invalid params. Usage: /setmethod <newyear | christmas | normal>? | Your input: ${params}`);
    });

    it("Should report an error if an uncaught error occurs", async () => {
      const ctx = createPrivateCTX(
        "/setmethod",
        1,
        1,
        1,
        "Test",
        undefined,
        undefined,
        undefined,
        undefined
      );
      replySpy = jest.spyOn(ctx, "reply");
      checkAdminSpy = jest.spyOn(core, "checkAdmin").mockRejectedValue(new Error("Test"));
      await middleware.setMethod(ctx as Context);
      expect(replySpy).not.toHaveBeenCalled();
    });
  });
});

describe('whichTime', () => {
  describe('successful tests', () => {
    describe('normal', () => {
      let isNewYearSpy: jest.SpyInstance;
      let isChristmasSpy: jest.SpyInstance;
      beforeAll(() => {
        isNewYearSpy = jest.spyOn(special, "isNewYear").mockReturnValue(false);
        isChristmasSpy = jest.spyOn(special, "isChristmas").mockReturnValue(false);
      });

      afterAll(() => {
        isNewYearSpy.mockRestore();
        isChristmasSpy.mockRestore();
      })
      it("Should return the time for normal", async () => {
        const ctx = createPrivateCTX(
          "/whichTime",
          1,
          1,
          1,
          "Test",
          undefined,
          undefined,
          undefined,
          undefined
        );
        await middleware.whichTime(ctx as Context);
        expect(ctx.reply).toHaveBeenCalledWith("It's not Christmas or New Year's Eve!");
      });
    });

    describe('christmas', () => {
      let isNewYearSpy: jest.SpyInstance;
      let isChristmasSpy: jest.SpyInstance;
      beforeAll(() => {
        isNewYearSpy = jest.spyOn(special, "isNewYear").mockReturnValue(false);
        isChristmasSpy = jest.spyOn(special, "isChristmas").mockReturnValue(true);
      });

      afterAll(() => {
        isNewYearSpy.mockRestore();
        isChristmasSpy.mockRestore();
      })
      it("Should return the time for christmas", async () => {
        const ctx = createPrivateCTX(
          "/whichTime",
          1,
          1,
          1,
          "Test",
          undefined,
          undefined,
          undefined,
          undefined
        );
        await middleware.whichTime(ctx as Context);
        expect(ctx.reply).toHaveBeenCalledWith("It's Christmas!");
      });
    });

    describe('newyear', () => {
      let isNewYearSpy: jest.SpyInstance;
      let isChristmasSpy: jest.SpyInstance;
      beforeAll(() => {
        isNewYearSpy = jest.spyOn(special, "isNewYear").mockReturnValue(true);
        isChristmasSpy = jest.spyOn(special, "isChristmas").mockReturnValue(false);
      });

      afterAll(() => {
        isNewYearSpy.mockRestore();
        isChristmasSpy.mockRestore();
      })
      it("Should return the time for normal", async () => {
        const ctx = createPrivateCTX(
          "/whichTime",
          1,
          1,
          1,
          "Test",
          undefined,
          undefined,
          undefined,
          undefined
        );
        await middleware.whichTime(ctx as Context);
        expect(ctx.reply).toHaveBeenCalledWith("It's New Year's Eve!");
      });
    });
    it("Should return the time for normal", async () => {
      const ctx = createPrivateCTX(
        "/whichTime",
        1,
        1,
        1,
        "Test",
        undefined,
        undefined,
        undefined,
        undefined
      );
    });
  });
});

describe('status', () => {
  describe('successful tests', () => {
    let checkAdminSpy: jest.SpyInstance;
    let fsMkdirSpy: jest.SpyInstance;
    let fsReaddirSpy: jest.SpyInstance;
    let getMediaCountSpy: jest.SpyInstance;

    beforeAll(() => {
      checkAdminSpy = jest.spyOn(core, "checkAdmin").mockResolvedValue(true);
      fsMkdirSpy = jest.spyOn(fs, "mkdir").mockResolvedValue(undefined);
      fsReaddirSpy = jest.spyOn(fs, "readdir").mockResolvedValue(files as any);
      getMediaCountSpy = jest.spyOn(media, "getMediaCount");
    });

    afterAll(() => {
      checkAdminSpy.mockRestore();
      fsMkdirSpy.mockRestore();
      fsReaddirSpy.mockRestore();
      getMediaCountSpy.mockRestore();
    });

    it("Should return the status of the bot", async () => {
      const ctx = createPrivateCTX(
        "/status",
        1,
        1,
        1,
        "Test",
        undefined,
        undefined,
        undefined,
        undefined
      );
      const ctxSpy = jest.spyOn(ctx, "reply");
      await middleware.status(ctx as Context);
      expect(getMediaCountSpy).toHaveBeenCalled();
      const mediaCount = new Map<directories, mediaCounts>();
      mediaCount.set("normal", {gif: 5, jpg: 5, mp4: 5});
      mediaCount.set("christmas", {gif: 5, jpg: 5, mp4: 5});
      mediaCount.set("newyear", {gif: 5, jpg: 5, mp4: 5});
      expect(getMediaCountSpy).toHaveReturnedWith(Promise.resolve(mediaCount));
      expect(ctxSpy).toHaveBeenCalled();
    });
  });
  describe('error handling', () => {
    describe('permission denied', () => {
      let checkAdminSpy: jest.SpyInstance;

      beforeAll(() => {
        checkAdminSpy = jest.spyOn(core, "checkAdmin").mockResolvedValue(false);
      });

      afterAll(() => {
        checkAdminSpy.mockRestore();
      });

      it("Should return permission denied", async () => {
        const ctx = createPrivateCTX(
          "/status",
          1,
          1,
          1,
          "Test",
          undefined,
          undefined,
          undefined,
          undefined
        );
        const ctxSpy = jest.spyOn(ctx, "reply");
        await middleware.status(ctx as Context);
        expect(ctxSpy).toHaveBeenCalledWith("You are not allowed to use this command");
      });
    });

    describe('fs error', () => {
      let checkAdminSpy: jest.SpyInstance;
      let fsMkdirSpy: jest.SpyInstance;
      let fsReaddirSpy: jest.SpyInstance;
      let reportErrorSpy: jest.SpyInstance;

      beforeAll(() => {
        checkAdminSpy = jest.spyOn(core, "checkAdmin").mockResolvedValue(true);
        fsMkdirSpy = jest.spyOn(fs, "mkdir").mockResolvedValue(undefined);
        fsReaddirSpy = jest.spyOn(fs, "readdir").mockRejectedValue(new Error("Test"));
        reportErrorSpy = jest.spyOn(core, "ReportError");
      });

      afterAll(() => {
        checkAdminSpy.mockRestore();
        fsMkdirSpy.mockRestore();
        fsReaddirSpy.mockRestore();
        reportErrorSpy.mockRestore();
      });

      it("Should return an error", async () => {
        const ctx = createPrivateCTX(
          "/status",
          1,
          1,
          1,
          "Test",
          undefined,
          undefined,
          undefined,
          undefined
        );
        const ctxSpy = jest.spyOn(ctx, "reply");
        await middleware.status(ctx as Context)
        expect(ctxSpy).not.toHaveBeenCalled();
        expect(reportErrorSpy).toHaveBeenCalled();
        ctxSpy.mockRestore();
      });
    });
  });
});

describe('addAdmin', () => {
  describe('successful tests', () => {
    let checkVenSpy: jest.SpyInstance;
    let reportErrorSpy: jest.SpyInstance;
    let querySpy: jest.SpyInstance;

    beforeAll(() => {
      checkVenSpy = jest.spyOn(core, "checkVen").mockReturnValue(true);
      reportErrorSpy = jest.spyOn(core, "ReportError");
      querySpy = jest.spyOn({queryMock}, "queryMock").mockResolvedValue([]);
    });

    afterAll(() => {
      checkVenSpy.mockRestore();
      reportErrorSpy.mockRestore();
      querySpy.mockRestore();
    });

    it("Should add an admin", async () => {
      const ctx = createPrivateCTX(
        "/addadmin 1 TEST",
        1,
        1,
        1,
        "Test",
        undefined,
        undefined,
        undefined,
        undefined
      );
      const ctxSpy = jest.spyOn(ctx, "reply");
      await middleware.addAdmin(ctx as Context);
      console.log(querySpy.mock.calls);
      expect(querySpy).toHaveBeenCalledWith("SELECT * FROM users WHERE userid = ?", [1]);
      expect(querySpy).toHaveBeenCalledWith("INSERT INTO users (userid, name) VALUES (?,?)", [1, 'TEST']);
    });
  });

  describe('error handling', () => {
    describe('NoMessageError', () => {
      it("Should return an error", async () => {
        const ctx = createPrivateCTX(
          "/addadmin",
          1,
          1,
          1,
          "Test",
          undefined,
          undefined,
          undefined,
          undefined
        );
        //@ts-ignore
        ctx.message = undefined;
        const ctxSpy = jest.spyOn(ctx, "reply");
        await middleware.addAdmin(ctx as Context);
        expect(ctxSpy).toHaveBeenCalledWith("No message object recieved-");
      });
    });

    describe("NoDirectMessageError", () => {
      it("Should deny the request", async () => {
        const ctx = createGroupCTX(
          "/addadmin",
          1,
          1,
          1,
          "Test",
          undefined,
          undefined,
          undefined,
          undefined
        );
        const ctxSpy = jest.spyOn(ctx, "reply");
        await middleware.addAdmin(ctx as Context);
        expect(ctxSpy).toHaveBeenCalledWith("This command can only be used in direct messages");
      });
    });

    describe('permission denied', () => {
      let checkAdminSpy: jest.SpyInstance;

      beforeAll(() => {
        checkAdminSpy = jest.spyOn(core, "checkAdmin").mockResolvedValue(false);
      });

      afterAll(() => {
        checkAdminSpy.mockRestore();
      });

      it("Should return permission denied", async () => {
        const ctx = createPrivateCTX(
          "/addadmin 2",
          1,
          1,
          1,
          "Test",
          undefined,
          undefined,
          undefined,
          undefined
        );
        const ctxSpy = jest.spyOn(ctx, "reply");
        await middleware.addAdmin(ctx as Context);
        expect(ctxSpy).toHaveBeenCalledWith("You are not allowed to use this command");
      });
    });

    describe("Missing params error", () => {
      let checkVenSpy: jest.SpyInstance;

      beforeAll(() => {
        checkVenSpy = jest.spyOn(core, "checkVen").mockReturnValue(true);
      });

      afterAll(() => {
        checkVenSpy.mockRestore();
      });
      it("Should return an error", async () => {
        const ctx = createPrivateCTX(
          "/addadmin 1",
          1,
          1,
          1,
          "Test",
          undefined,
          undefined,
          undefined,
          undefined
        );
        const ctxSpy = jest.spyOn(ctx, "reply");
        await middleware.addAdmin(ctx as Context);
        expect(ctxSpy).toHaveBeenCalledWith("Usage: /adduser <ID> <name>");
      });
    });

    describe('InvalidParamsError', () => {
      let checkVenSpy: jest.SpyInstance;

      beforeAll(() => {
        checkVenSpy = jest.spyOn(core, "checkVen").mockReturnValue(true);
      });

      afterAll(() => {
        checkVenSpy.mockRestore();
      });
      it("Should return an error", async () => {
        const ctx = createPrivateCTX(
          "/addadmin DDDD DDDD",
          1,
          1,
          1,
          "Test",
          undefined,
          undefined,
          undefined,
          undefined
        );
        const ctxSpy = jest.spyOn(ctx, "reply");
        await middleware.addAdmin(ctx as Context);
        expect(ctxSpy).toHaveBeenCalledWith("ID must be a number");
      });
    });
    
    describe('AlreadyExistsError', () => {
      let checkVenSpy: jest.SpyInstance;

      beforeAll(() => {
        checkVenSpy = jest.spyOn(core, "checkVen").mockReturnValue(true);
        queryMock.mockResolvedValue([{userid: 1}]);
      });

      afterAll(() => {
        queryMock.mockRestore();
        checkVenSpy.mockRestore();
      })


      it("should throw an error", async () => {
        const ctx = createPrivateCTX(
          "/addadmin 1 TEST",
          1,
          1,
          1,
          "Test",
          undefined,
          undefined,
          undefined,
          undefined
        );
        const ctxSpy = jest.spyOn(ctx, "reply");
        await middleware.addAdmin(ctx as Context);
        expect(ctxSpy).toHaveBeenCalledWith("User already exists");
      });

    });

    describe('DB error', () => {
      let checkAdminSpy: jest.SpyInstance;
      let fsReadFileSpy: jest.SpyInstance;
      let fsWriteFileSpy: jest.SpyInstance;
      let reportErrorSpy: jest.SpyInstance;

      beforeAll(() => {
        checkAdminSpy = jest.spyOn(core, "checkVen").mockReturnValue(true);
        fsReadFileSpy = jest.spyOn(fs, "readFile").mockRejectedValue(new Error("Test"));
        fsWriteFileSpy = jest.spyOn(fs, "writeFile").mockResolvedValue(undefined);
        reportErrorSpy = jest.spyOn(core, "ReportError");
      });

      afterAll(() => {
        checkAdminSpy.mockRestore();
        fsReadFileSpy.mockRestore();
        fsWriteFileSpy.mockRestore();
        reportErrorSpy.mockRestore();
      });

      it("Should return an error", async () => {
        const ctx = createPrivateCTX(
          "/addadmin 2 TEST",
          1,
          1,
          1,
          "Test",
          undefined,
          undefined,
          undefined,
          undefined
        );
        const ctxSpy = jest.spyOn(ctx, "reply");
        await middleware.addAdmin(ctx as Context)
        expect(ctxSpy).toHaveBeenCalledWith("Error while adding user to database: "+ JSON.stringify({type: "get", name: "DBError"}));
        ctxSpy.mockRestore();
      });
    });
  });
});

describe('removeAdmin', () => {
  describe('successful tests', () => {
    let checkVenSpy: jest.SpyInstance;
    let reportErrorSpy: jest.SpyInstance;
    let querySpy: jest.SpyInstance;

    beforeAll(() => {
      checkVenSpy = jest.spyOn(core, "checkVen").mockReturnValue(true);
      reportErrorSpy = jest.spyOn(core, "ReportError");
      querySpy = jest.spyOn({queryMock}, "queryMock").mockResolvedValue([{userid: 2}]);
    });

    afterAll(() => {
      checkVenSpy.mockRestore();
      reportErrorSpy.mockRestore();
      querySpy.mockRestore();
    });

    it("Should remove admin", async () => {
      const ctx = createPrivateCTX(
        "/removeadmin 2",
        1,
        1,
        1,
        "Test",
        undefined,
        undefined,
        undefined,
        undefined
      );
      const ctxSpy = jest.spyOn(ctx, "reply");
      await middleware.removeAdmin(ctx as Context);
      expect(ctxSpy).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    describe('NoMessageError', () => {
      it("Should throw an error", async () => {
        const ctx = createPrivateCTX(
          "/removeadmin 2",
          1,
          1,
          1,
          "Test",
          undefined,
          undefined,
          undefined,
          undefined
        );
        //@ts-ignore
        ctx.message = undefined;
        const ctxSpy = jest.spyOn(ctx, "reply");
        await middleware.removeAdmin(ctx as Context);
        expect(ctxSpy).toHaveBeenCalledWith("No message object recieved-");
      });
    });
    describe('NotDirectMessageError', () => {
      it("Should throw an error", async () => {
        const ctx = createGroupCTX(
          "/removeadmin 2",
          1,
          1,
          1,
          "Test",
          undefined,
          undefined,
          undefined,
          undefined
        );
        const ctxSpy = jest.spyOn(ctx, "reply");
        await middleware.removeAdmin(ctx as Context);
        expect(ctxSpy).toHaveBeenCalledWith("This command can only be used in direct messages");
      });
    });

    describe('PermissionDeniedError', () => {
      let checkVenSpy: jest.SpyInstance;

      beforeAll(() => {
        checkVenSpy = jest.spyOn(core, "checkVen").mockReturnValue(false);
      });

      afterAll(() => {
        checkVenSpy.mockRestore();
      });

      it("Should throw an error", async () => {
        const ctx = createPrivateCTX(
          "/removeadmin 2",
          1,
          1,
          1,
          "Test",
          undefined,
          undefined,
          undefined,
          undefined
        );
        const ctxSpy = jest.spyOn(ctx, "reply");
        await middleware.removeAdmin(ctx as Context);
        expect(ctxSpy).toHaveBeenCalledWith("You are not allowed to use this command");
      });
    });

    describe('MissingParamsError', () => {
      let checkVenSpy: jest.SpyInstance;
      beforeAll(() => {
        checkVenSpy = jest.spyOn(core, "checkVen").mockReturnValue(true);
      });

      afterAll(() => {
        checkVenSpy.mockRestore();
      });

      it("Should throw an error", async () => {
        const ctx = createPrivateCTX(
          "/removeadmin",
          1,
          1,
          1,
          "Test",
          undefined,
          undefined,
          undefined,
          undefined
        );
        const ctxSpy = jest.spyOn(ctx, "reply");
        await middleware.removeAdmin(ctx as Context);
        expect(ctxSpy).toHaveBeenCalledWith("Usage: /removeuser <ID>");
      });
    });
    
    describe('InvalidParamsError', () => {
      let checkVenSpy: jest.SpyInstance;
      
      beforeAll(() => {
        checkVenSpy = jest.spyOn(core, "checkVen").mockReturnValue(true);
      });

      afterAll(() => {
        checkVenSpy.mockRestore();
      });

      it("Should throw an error", async () => {
        const ctx = createPrivateCTX(
          "/removeadmin TEST TEST",
          1,
          1,
          1,
          "Test",
          undefined,
          undefined,
          undefined,
          undefined
        );
        const ctxSpy = jest.spyOn(ctx, "reply");
        await middleware.removeAdmin(ctx as Context);
        expect(ctxSpy).toHaveBeenCalledWith("ID must be a number");
        ctxSpy.mockRestore();
      });
    });

    describe('DBError', () => {
      let checkVenSpy: jest.SpyInstance;
      let reportErrorSpy: jest.SpyInstance;
      let querySpy: jest.SpyInstance;

      beforeAll(() => {
        checkVenSpy = jest.spyOn(core, "checkVen").mockReturnValue(true);
        reportErrorSpy = jest.spyOn(core, "ReportError");
        querySpy = jest.spyOn({queryMock}, "queryMock").mockRejectedValue(new Error("Test"));
      });

      afterAll(() => {
        checkVenSpy.mockRestore();
        reportErrorSpy.mockRestore();
        querySpy.mockRestore();
      });

      it("Should throw an error", async () => {
        const ctx = createPrivateCTX(
          "/removeadmin 2",
          1,
          1,
          1,
          "Test",
          undefined,
          undefined,
          undefined,
          undefined
        );
        const ctxSpy = jest.spyOn(ctx, "reply");
        await middleware.removeAdmin(ctx as Context);
        expect(ctxSpy).toHaveBeenCalledWith("Error while removing user from the database: " + JSON.stringify({type: "get", name: "DBError"}));
      });
    });
    
  });
});

describe('handleMedia', () => {
  describe('Successful tests', () => {
    let checkVenSpy: jest.SpyInstance;
    let mediaSpy: jest.SpyInstance;

    beforeAll(() => {
      checkVenSpy = jest.spyOn(core, "checkAdmin").mockResolvedValue(true);
      mediaSpy = jest.spyOn(media, "uploadMedia").mockImplementation(() => Promise.resolve(null));
    });

    afterAll(() => {
      checkVenSpy.mockRestore();
      mediaSpy.mockRestore();
    });

    it("Should upload the media", async () => {
      const ctx = createPrivateCTX(
        "",
        1,
        1,
        1,
        "Test",
        undefined,
        [{file_id: "1", file_unique_id: "1", height: 0, width: 0}],
        undefined,
        undefined
      );
      const ctxSpy = jest.spyOn(ctx, "reply");
      await middleware.handleMedia(ctx as Context, "photo");
      expect(ctxSpy).not.toHaveBeenCalled();
      expect(mediaSpy).toHaveBeenCalledWith(ctx.message, "photo");
    });
  });

  describe('error handling', () => {
    describe('NoMessage', () => {
      it("Should throw an error", async () => {
        const ctx = createPrivateCTX(
          "",
          1,
          1,
          1,
          "Test",
          undefined,
          undefined,
          undefined,
          undefined
        );
        //@ts-ignore
        ctx.message = undefined;
        const ctxSpy = jest.spyOn(ctx, "reply");
        await middleware.handleMedia(ctx as Context, "photo");
        expect(ctxSpy).toHaveBeenCalledWith("No message object recieved-");
      });
    });
    describe('NoDirectMessage', () => {
      it("Should throw an error", async () => {
        const ctx = createGroupCTX(
          "",
          1,
          1,
          1,
          "Test",
          undefined,
          undefined,
          undefined,
          undefined
        );
        const ctxSpy = jest.spyOn(ctx, "reply");
        await middleware.handleMedia(ctx as Context, "photo");
        expect(ctxSpy).toHaveBeenCalledWith("This command can only be used in direct messages");
      });
    });

    describe('PermissionDeniedError', () => {
      let checkAdminSpy: jest.SpyInstance;
      beforeAll(() => {
        checkAdminSpy = jest.spyOn(core, "checkAdmin").mockResolvedValue(false);
      });

      afterAll(() => {
        checkAdminSpy.mockRestore();
      });
      it("Should throw an error", async () => {
        const ctx = createPrivateCTX(
          "",
          1,
          1,
          1,
          "Test",
          undefined,
          undefined,
          undefined,
          undefined
        );
        const ctxSpy = jest.spyOn(ctx, "reply");
        await middleware.handleMedia(ctx as Context, "photo");
        expect(ctxSpy).toHaveBeenCalledWith("You are not allowed to use this command");
      });
    });

    describe.skip('EmptyFileError', () => {
      let fsStatSpy: jest.SpyInstance;
      let fsUnlinkSpy: jest.SpyInstance;
      let downloadFileSpy: jest.SpyInstance;
      // let uploadMediaSpy: jest.SpyInstance;
      beforeAll(() => {
        fsStatSpy = jest.spyOn(fs, "stat").mockResolvedValue({size: 0, isFile: () => true} as any);
        fsUnlinkSpy = jest.spyOn(fs, "unlink").mockResolvedValue(undefined);
        downloadFileSpy = jest.spyOn({downloadFile}, "downloadFile").mockImplementation(() => Promise.resolve());
        // uploadMediaSpy = jest.spyOn(media, "uploadMedia"); // Not overwriting or mocking
      });
      afterAll(() => {
        fsStatSpy.mockRestore();
        fsUnlinkSpy.mockRestore();
        downloadFileSpy.mockRestore();
        // uploadMediaSpy.mockRestore();
      });
      it("Should throw an error", async () => {
        const ctx = createPrivateCTX(
          "",
          1,
          1,
          1,
          "Test",
          undefined,
          [{file_id: "1", file_unique_id: "1", height: 0, width: 0, file_size: 0}],
          undefined,
          undefined
        );
        const ctxSpy = jest.spyOn(ctx, "reply");
        await middleware.handleMedia(ctx as Context, "photo"); // Calling the entrypoint, which calls uploadMedia
        // await expect(uploadMediaSpy).rejects.toThrow(EmptyFileError);
        expect(downloadFileSpy).toHaveBeenCalled();
        expect(fsStatSpy).toHaveBeenCalled();
        console.warn(ctxSpy.mock.calls[0]);
        expect(ctxSpy).toHaveBeenCalledWith("File is empty! Try again");
      });
    });




  });
});

describe('addCaptionToMedia', () => {
  describe('successful test', () => { 
    let checkAdminSpy: jest.SpyInstance;
    let readFileSpy: jest.SpyInstance;
    let writeFileSpy: jest.SpyInstance;

    beforeAll(() => {
      checkAdminSpy = jest.spyOn(core, "checkAdmin").mockResolvedValue(true);
      readFileSpy = jest.spyOn(fs, "readFile").mockImplementation(() => Promise.resolve(Buffer.from("[]")));
      writeFileSpy = jest.spyOn(fs, "writeFile").mockResolvedValue(undefined);
    });

    afterAll(() => {
      checkAdminSpy.mockRestore();
      readFileSpy.mockRestore();
      writeFileSpy.mockRestore();
    });

    it("Should add a caption", async () => {
      const ctx = createPrivateCTX(
        "/addmodmed TEST TEST",
        1,
        1,
        1,
        "Test",
        undefined,
        undefined,
        undefined,
        {
          reply_to_message_id: 1,
          photo: [{file_id: "1", file_unique_id: "1", height: 0, width: 0}]
        }
      );
      const ctxSpy = jest.spyOn(ctx, "reply");
      await middleware.addCaptionToMedia(ctx as Context);
      expect(ctxSpy).toHaveBeenCalledWith(`Der Media 1 wurde TEST TEST hinzugefügt`);
      expect(writeFileSpy).toHaveBeenCalled();
    });
  });


  describe('error handling', () => {
    describe('NoMessage', () => {
      it("Should throw an error", async () => {
        const ctx = createPrivateCTX(
          "/addmodmed TEST TEST",
          1,
          1,
          1,
          "Test",
          undefined,
          undefined,
          undefined,
          undefined
        );
        //@ts-ignore
        ctx.message = undefined;
        const ctxSpy = jest.spyOn(ctx, "reply");
        await middleware.addCaptionToMedia(ctx as Context);
        expect(ctxSpy).toHaveBeenCalledWith("No message object recieved-");
      });
    });
    describe('NoDirectMessage', () => {
      it("Should throw an error", async () => {
        const ctx = createGroupCTX(
          "/addmodmed TEST TEST",
          1,
          1,
          1,
          "Test",
          undefined,
          undefined,
          undefined,
          undefined
        );
        const ctxSpy = jest.spyOn(ctx, "reply");
        await middleware.addCaptionToMedia(ctx as Context);
        expect(ctxSpy).toHaveBeenCalledWith("This command can only be used in direct messages");
      });
    });

    describe('PermissionDeniedError', () => {
      let checkAdminSpy: jest.SpyInstance;
      beforeAll(() => {
        checkAdminSpy = jest.spyOn(core, "checkAdmin").mockResolvedValue(false);
      });

      afterAll(() => {
        checkAdminSpy.mockRestore();
      });
      it("Should throw an error", async () => {
        const ctx = createPrivateCTX(
          "/addmodmed TEST TEST",
          1,
          1,
          1,
          "Test",
          undefined,
          undefined,
          undefined,
          undefined
        );
        const ctxSpy = jest.spyOn(ctx, "reply");
        await middleware.addCaptionToMedia(ctx as Context);
        expect(ctxSpy).toHaveBeenCalledWith("You are not allowed to use this command");
      });
    });

    describe('InvalidMediaError', () => {
      let checkAdminSpy: jest.SpyInstance;
      beforeAll(() => {
        checkAdminSpy = jest.spyOn(core, "checkAdmin").mockResolvedValue(true);
      });
      afterAll(() => {
        checkAdminSpy.mockRestore();
      });
      it("Should throw an error", async () => {
        const ctx = createPrivateCTX(
          "/addmodmed TEST TEST",
          1,
          1,
          1,
          "Test",
          undefined,
          undefined,
          undefined,
          {
            reply_to_message_id: 1,
            document: {file_id: "1", file_unique_id: "1", file_name: "1", mime_type: "pdf" }
          }
        );
        const ctxSpy = jest.spyOn(ctx, "reply");
        await middleware.addCaptionToMedia(ctx as Context);
        expect(ctxSpy).toHaveBeenCalledWith("Invalid media, only photos, videos and gifs are supported");
      });
    });

    describe('MissingParamsError', () => {
      let checkAdminSpy: jest.SpyInstance;
      beforeAll(() => {
        checkAdminSpy = jest.spyOn(core, "checkAdmin").mockResolvedValue(true);
      });
      afterAll(() => {
        checkAdminSpy.mockRestore();
      });
      it("Should throw an error", async () => {
        const ctx = createPrivateCTX(
          "/addmodmed",
          1,
          1,
          1,
          "Test",
          undefined,
          undefined,
          undefined,
          {
            reply_to_message_id: 1,
            photo: [{file_id: "1", file_unique_id: "1", height: 0, width: 0}]
          }
        );
        const ctxSpy = jest.spyOn(ctx, "reply");
        await middleware.addCaptionToMedia(ctx as Context);
        expect(ctxSpy).toHaveBeenCalledWith("Usage: /addmodmed <caption>");
      });
    });

    describe('DB error', () => {
      let checkAdminSpy: jest.SpyInstance;
      let reportErrorSpy: jest.SpyInstance;

      beforeAll(() => {
        queryMock.mockRejectedValue(new Error("Test"));
        checkAdminSpy = jest.spyOn(core, "checkVen").mockReturnValue(true);
        reportErrorSpy = jest.spyOn(core, "ReportError");
      });

      afterAll(() => {
        queryMock.mockResolvedValue([]);
        checkAdminSpy.mockRestore();
        reportErrorSpy.mockRestore();
      });

      it("Should return an error", async () => {
        const ctx = createPrivateCTX(
          "/addmodmed 2 TEST",
          1,
          1,
          1,
          "Test",
          undefined,
          undefined,
          undefined,
          undefined
        );
        const ctxSpy = jest.spyOn(ctx, "reply");
        await middleware.addCaptionToMedia(ctx as Context)
        expect(ctxSpy).toHaveBeenCalledWith("Error while adding media to database: "+ JSON.stringify({type: "get", name: "DBError"}));
        ctxSpy.mockRestore();
      });
    });

  });
})