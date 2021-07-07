package dev.juho.fileshare.server.fs;

import dev.juho.fileshare.server.log.Log;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;

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
		if (!isFileSystemReady()) {
			Log.e("File system was not ready for writing!");
			return;
		}

		Log.d("Trying to write to " + file);
		try {
			File f = new File(file);

			FileWriter writer = new FileWriter(f);
			writer.write(data.toString());
			writer.flush();
			writer.close();
			Log.d("Writing finished");
		} catch (IOException e) {
			e.printStackTrace();
		}
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
