package dev.juho.fileshare.server.server.client;

import dev.juho.fileshare.server.log.Log;
import dev.juho.fileshare.server.server.Server;
import dev.juho.fileshare.server.server.client.io.Message;
import dev.juho.fileshare.server.server.client.io.Reader;
import dev.juho.fileshare.server.server.client.io.Writer;

import java.net.Socket;
import java.util.Date;

public class Client {

	private final Socket socket;
	private final Reader reader;
	private final Writer writer;

	private ClientState clientState;

	private short clientId;
	private long lastMessageTime;

	private String friendToken;

	public Client(Socket socket) {
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
}
