package dev.juho.fileshare.server.fs;

public class FileWriteBuffer {

	private final static short BUFFER_SIZE = 1024 * 16;

	private final FileSystem fs;
	private final String fileName;

	private final byte[] buffer;
	private int currentBufferSize;

	private long bytesWrittenToFile;

	public FileWriteBuffer(FileSystem fs, String fileName) {
		this.fs = fs;
		this.fileName = fileName;

		this.buffer = new byte[BUFFER_SIZE];
		this.currentBufferSize = 0;

		this.bytesWrittenToFile = 0;
	}

	public void append(byte[] buf, int off, int len) {
		int newDataLength = len - off;

		if (currentBufferSize + newDataLength >= BUFFER_SIZE) {
			flushBuffer();
		}

		System.arraycopy(buf, off, buffer, currentBufferSize, len);
		currentBufferSize += newDataLength;
	}

	public void flush() {
		flushBuffer();
	}

	public long getBytesWrittenToFile() {
		return bytesWrittenToFile;
	}

	private void flushBuffer() {
		// This will currently always open a new file output stream and that's definitely not good. Make filesystem hold
		// on to file streams a little longer and please make it smart :-)
		fs.append(fileName, buffer, 0, currentBufferSize);
		bytesWrittenToFile += currentBufferSize;
		currentBufferSize = 0;
	}
}
