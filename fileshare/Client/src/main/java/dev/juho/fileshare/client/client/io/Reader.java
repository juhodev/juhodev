package dev.juho.fileshare.client.client.io;

import dev.juho.fileshare.client.client.Client;
import dev.juho.fileshare.client.client.ClientState;
import dev.juho.fileshare.client.utils.Log;

import java.io.BufferedInputStream;
import java.io.IOException;

public class Reader extends Thread {

	private final Client client;

	private final static int BUFFER_SIZE = 2048;

	private MessageListener listener;

	public Reader(Client client) {
		this.client = client;
	}

	public void setListener(MessageListener listener) {
		this.listener = listener;
	}

	@Override
	public void run() {
		super.run();

		try {
			listen();
		} catch (IOException e) {
			client.updateClientState(ClientState.DISCONNECTED);
			e.printStackTrace();
		}
	}

	private void listen() throws IOException {
		Log.d("Starting to listen");
		BufferedInputStream reader = new BufferedInputStream(client.getSocket().getInputStream());
		while (client.getClientState() == ClientState.CONNECTED) {
			byte[] buffer = new byte[BUFFER_SIZE];

			int bytesRead;
			while ((bytesRead = reader.read(buffer, 0, BUFFER_SIZE)) != -1) {
				Log.d("Received " + bytesRead + " bytes");
				Message msg = Message.read(buffer);

				if (listener != null) {
					listener.onMessage(msg);
				}
			}
		}
	}

	public interface MessageListener {
		void onMessage(Message message);
	}

}
