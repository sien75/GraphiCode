import { file } from "bun";

class FileLockManager {
  private locks: Map<string, Promise<void>> = new Map();

  async acquireLock(filePath: string): Promise<() => void> {
    const currentLock = this.locks.get(filePath) || Promise.resolve();

    let releaseLock: () => void;
    const newLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    this.locks.set(
      filePath,
      currentLock.then(() => newLock)
    );

    await currentLock;

    return releaseLock!;
  }

  cleanupLock(filePath: string): void {
    const lock = this.locks.get(filePath);
    if (lock) {
      lock.then(() => {
        if (this.locks.get(filePath) === lock) {
          this.locks.delete(filePath);
        }
      });
    }
  }
}

const lockManager = new FileLockManager();

export async function safeRead(
  filePath: string
): Promise<{ content: string; release: () => void }> {
  const release = await lockManager.acquireLock(filePath);

  try {
    const content = await file(filePath).text();
    return { content, release };
  } catch (error) {
    release();
    throw error;
  }
}

export async function safeWrite(
  filePath: string,
  content: string,
  release: () => void
): Promise<void> {
  try {
    await Bun.write(filePath, content);
  } finally {
    release();
  }
}

export async function safeReadWrite(
  filePath: string,
  modifier: (content: string) => string | Promise<string>
): Promise<void> {
  const { content, release } = await safeRead(filePath);
  try {
    const newContent = await modifier(content);
    await safeWrite(filePath, newContent, release);
  } catch (error) {
    release();
    throw error;
  }
}
