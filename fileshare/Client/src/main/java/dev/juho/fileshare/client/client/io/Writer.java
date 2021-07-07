package dev.juho.fileshare.client.client.io;

import dev.juho.fileshare.client.client.Client;
import dev.juho.fileshare.client.client.ClientState;
import dev.juho.fileshare.client.utils.Log;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

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

	public void sendHello() {
		Message msg = new Message(
				(short) 0,
				Message.TYPE_HELLO,
				Message.CONTENT_TYPE_BINARY,
				client.getClientId(),
				new byte[]{}
		);

		try {
			write(msg.toByteArray());
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public void sendUserInfo() {
		Message msg = new Message(
				(short) 0,
				Message.TYPE_USER_INFO,
				Message.CONTENT_TYPE_TEXT,
				client.getClientId(),
				new byte[]{}
		);

		try {
			write(msg.toByteArray());
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public void write(String message) {
		byte[] messageBytes = message.getBytes(StandardCharsets.UTF_8);

		Message msg = new Message(
				(short) messageBytes.length,
				Message.TYPE_DEBUG_MESSAGE,
				Message.CONTENT_TYPE_TEXT,
				client.getClientId(),
				messageBytes
		);

		try {
			write(msg.toByteArray());
		} catch (Exception e) {
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
