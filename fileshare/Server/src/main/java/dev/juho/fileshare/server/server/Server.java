package dev.juho.fileshare.server.server;

import dev.juho.fileshare.server.fs.FileSystem;
import dev.juho.fileshare.server.log.Log;
import dev.juho.fileshare.server.server.client.Client;
import dev.juho.fileshare.server.server.client.io.Message;

import java.io.File;
import java.io.IOException;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;

public class Server {

	private final int port;

	private final FileSystem fs;
	private final ClientPool clientPool;

	public Server(int port) {
		this.port = port;
		this.fs = new FileSystem(new File("data"));
		this.clientPool = new ClientPool(fs);
	}

	public void start() throws IOException {
		fs.init();

		Log.i("Starting server on port " + port);
		ServerSocket serverSocket = new ServerSocket(port);

		while (true) {
			Socket clientSocket = serverSocket.accept();
			Log.i("New client connected");

			clientPool.add(clientSocket);
		}
	}

	public static void sendServerHello(Client client) {
		sendServerMessage(
				Message.TYPE_HELLO_RESPONSE,
				Message.CONTENT_TYPE_TEXT,
				Integer.toString(client.getClientId()).getBytes(StandardCharsets.UTF_8),
				client
		);
	}

	public static void sendClientInfo(Client client) {
		sendServerMessage(
				Message.TYPE_USER_INFO,
				Message.CONTENT_TYPE_TEXT,
				client.getFriendToken().getBytes(StandardCharsets.UTF_8),
				client
		);
	}

	public static void sendServerMessage(byte messageType, byte contentType, byte[] payload, Client client) {
		Message msg = new Message(
				(short) payload.length,
				messageType,
				contentType,
				(short) -666,
				payload
		);
		try {
			client.getWriter().write(msg.toByteArray());
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

}
