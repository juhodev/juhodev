package dev.juho.fileshare.server.server.client;

import dev.juho.fileshare.server.fs.FileSystem;
import dev.juho.fileshare.server.fs.FileWriteBuffer;
import dev.juho.fileshare.server.log.Log;
import dev.juho.fileshare.server.server.Server;
import dev.juho.fileshare.server.server.client.io.Message;
import dev.juho.fileshare.server.server.client.io.Reader;
import dev.juho.fileshare.server.server.client.io.Writer;

import java.io.File;
import java.net.Socket;
import java.util.Date;

public class Client {

	private final FileSystem fs;

	private final Socket socket;
	private final Reader reader;
	private final Writer writer;

	private ClientState clientState;

	private short clientId;
	private long lastMessageTime;

	private String friendToken;
	private FileWriteBuffer fileWriteBuffer;

	public Client(FileSystem fs, Socket socket) {
		this.fs = fs;
		this.socket = socket;
		this.clientState = ClientState.WAITING_FOR_CONNECTION;
		this.reader = new Reader(this);
		this.writer = new Writer(this);

		this.clientId = -1;
		this.lastMessageTime = -1;
	}

	public void listen() {
		clientState = ClientState.CONNECTED;
		reader.start();

		reader.setListener(message -> {
			lastMessageTime = new Date().getTime();
			Log.d("Message received " + message.toString());

			if (message.getClientId() == -1 && message.getType() != Message.TYPE_HELLO) {
				Log.e("A client tried to send something other than a HELLO with an id of -1 " + socket.toString());
				return;
			}

			switch (message.getType()) {
				case Message.TYPE_HELLO:
					Server.sendServerHello(this);
					break;

				case Message.TYPE_USER_INFO:
					Server.sendClientInfo(this);
					break;

				case Message.TYPE_NEW_FILE:
					handleNewFileCreate(message);
					break;

				case Message.TYPE_FILE_TRANSFER:
					handleFileTransfer(message);
					break;
			}
		});
	}

	public String getFriendToken() {
		if (friendToken == null) {
			friendToken = Double.toHexString(Math.random() * Integer.MAX_VALUE);
		}

		return friendToken;
	}

	public void setClientId(short clientId) {
		this.clientId = clientId;
	}

	public void updateClientState(ClientState clientState) {
		this.clientState = clientState;
	}

	public short getClientId() {
		return clientId;
	}

	public ClientState getClientState() {
		return clientState;
	}

	public Socket getSocket() {
		return socket;
	}

	public Writer getWriter() {
		return writer;
	}

	public long getLastMessageTime() {
		return lastMessageTime;
	}

	@Override
	public String toString() {
		return socket.getInetAddress().toString() + "," + clientState + "," + clientId + "," + lastMessageTime + "," + friendToken;
	}

	private void handleNewFileCreate(Message message) {
		String payload = new String(message.getPayload());
		fileWriteBuffer = new FileWriteBuffer(fs, payload);
	}

	private void handleFileTransfer(Message message) {
		if (fileWriteBuffer == null) {
			Log.e("File write buffer does not exist!!!");
			return;
		}

		fileWriteBuffer.append(message.getPayload(), 0, message.getPayloadLength());
	}
}
