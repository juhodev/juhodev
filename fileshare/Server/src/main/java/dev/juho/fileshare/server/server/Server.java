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
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.atomic.AtomicBoolean;

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
		Log.d("Initializing stuff");
		fs.init();
		createTimers();
		Log.d("Stuff initialized");

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

	private void createTimers() {
		AtomicBoolean shouldUpdateClientPool = new AtomicBoolean(false);

		new Timer().scheduleAtFixedRate(new TimerTask() {
			@Override
			public void run() {
				if (shouldUpdateClientPool.get() || clientPool.size() > 0) {
					updateLogFiles();

					shouldUpdateClientPool.set(true);
					if (clientPool.size() == 0) {
						shouldUpdateClientPool.set(false);
					}
				}
			}
		}, 1000 * 60, 1000 * 60);
	}

	/**
	 * This writes to client pool to a file. This file is meant to be read by other programs.
	 * <p>
	 * I could use an RPC library for this but right now I don't have any interest for that.
	 */
	private void updateLogFiles() {
		fs.write("client_pool.csv", clientPool);
	}

}
