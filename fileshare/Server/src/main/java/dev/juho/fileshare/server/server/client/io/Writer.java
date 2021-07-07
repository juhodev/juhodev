package dev.juho.fileshare.server.server.client.io;

import dev.juho.fileshare.server.log.Log;
import dev.juho.fileshare.server.server.client.Client;
import dev.juho.fileshare.server.server.client.ClientState;

import java.io.IOException;
import java.io.OutputStream;

public class Writer {

	private final Client client;

	private OutputStream outputStream;

	public Writer(Client client) {
		this.client = client;
		try {
			this.outputStream = client.getSocket().getOutputStream();
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	public void write(byte[] bytes) {
		try {
			Log.d("Sending " + bytes.length + " bytes");
			outputStream.write(bytes);
		} catch (IOException e) {
			client.updateClientState(ClientState.DISCONNECTED);
			e.printStackTrace();
		}
	}
}
