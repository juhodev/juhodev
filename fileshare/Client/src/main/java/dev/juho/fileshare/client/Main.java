package dev.juho.fileshare.client;

import dev.juho.fileshare.client.client.Client;
import dev.juho.fileshare.client.web.WebServer;

import java.io.File;
import java.io.IOException;

public class Main {

	public static void main(String[] args) {
		File dataFolder = new File("data");
		FileSystem fileSystem = new FileSystem(dataFolder);
		fileSystem.init();

		Client client = new Client(fileSystem, "localhost", 9999);
		client.load();
		client.start();

		WebServer webServer = new WebServer();
		try {
			webServer.start(client);
		} catch (IOException e) {
			e.printStackTrace();
		}
//		client.getWriter().write("Connected!".getBytes(StandardCharsets.UTF_8));
//		client.getWriter().write("Connected!");
	}

}
