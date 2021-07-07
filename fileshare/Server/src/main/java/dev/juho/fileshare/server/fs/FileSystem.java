package dev.juho.fileshare.server.fs;

import dev.juho.fileshare.server.log.Log;

import java.io.*;

public class FileSystem {

	private final File rootDataDir;
	private boolean initialized;

	public FileSystem(File rootDataDir) {
		this.rootDataDir = rootDataDir;
		this.initialized = false;
	}

	/**
	 * This makes sure every needed file exists
	 */
	public void init() {
		if (!rootDataDir.exists()) {
			boolean created = rootDataDir.mkdir();

			if (!created) {
				Log.e("Could not create root data dir (" + rootDataDir.getAbsolutePath() + ")");
			}
		}

		initialized = true;
	}

	/**
	 * This will call the <c>data</c> objects <c>toString()</c> method and save it to a file
	 *
	 * @param file File name of the file you want to write to
	 * @param data Data you want to write to the file
	 */
	public void write(String file, Object data) {
		Log.d("Trying to write to " + file);
		try {
			File f = getFile(file);
			if (f == null) {
				return;
			}

			FileWriter writer = new FileWriter(f);
			writer.write(data.toString());
			writer.close();
			Log.d("Writing finished");
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	public void append(String file, byte[] buf, int off, int len) {
		File f = getFile(file);
		if (f == null) {
			return;
		}

		try {
			BufferedOutputStream bos = new BufferedOutputStream(new FileOutputStream(f));
			bos.write(buf, off, len);
			bos.close();
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	private File getFile(String file) {
		if (!isFileSystemReady()) {
			Log.e("File system was not ready for writing!");
			return null;
		}

		File f = new File(rootDataDir.getAbsolutePath() + "/" + file);
		if (!f.exists()) {
			try {
				boolean created = f.createNewFile();
				if (!created) {
					Log.e("Could not create a new file! (" + f.getAbsolutePath() + ")");
					return null;
				}
			} catch (IOException e) {
				e.printStackTrace();
				return null;
			}
		}

		if (!f.canRead() || !f.canWrite()) {
			Log.e("This file can't be read or written to (" + f.getAbsolutePath() + ")");
			return null;
		}

		return f;
	}

	/**
	 * Return whether or not the file system is ready to written/read to/from
	 *
	 * @return true, if file system is ready
	 */
	private boolean isFileSystemReady() {
		return initialized;
	}

}
