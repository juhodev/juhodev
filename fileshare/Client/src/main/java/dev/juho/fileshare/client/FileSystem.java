package dev.juho.fileshare.client;

import dev.juho.fileshare.client.utils.Log;

import java.io.*;

public class FileSystem {

	private File dataDir;

	public FileSystem(File dateDir) {
		this.dataDir = dateDir;
	}

	public void init() {
		if (dataDir.exists()) {
			return;
		}

		Log.i("Creating " + dataDir.getAbsolutePath() + " for saving data");
		dataDir.mkdir();
	}

	public void write(String file, String text) {
		File f = new File(dataDir + "/" + file);
		Log.d("Writing " + text + " to " + f.getAbsolutePath());

		try {
			FileWriter writer = new FileWriter(f);
			writer.write(text);
			writer.flush();
			writer.close();
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	public short readClientId() {
		File f = new File(dataDir + "/client_id.txt");

		if (!f.exists()) {
			return -1;
		}

		try {
			return Short.parseShort(readFile(f));
		} catch (IOException e) {
			e.printStackTrace();
		}

		return -1;
	}

 	private String readFile(File f) throws IOException {
		StringBuilder builder = new StringBuilder();
		BufferedReader reader = new BufferedReader(new InputStreamReader(new FileInputStream(f)));

		String line;
		while ((line = reader.readLine()) != null) {
			if (builder.length() > 0) {
				builder.append("\n");
			}

			builder.append(line);
		}

		return builder.toString();
	}

}
