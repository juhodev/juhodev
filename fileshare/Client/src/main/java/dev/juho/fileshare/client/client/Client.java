package dev.juho.fileshare.client.client;

import dev.juho.fileshare.client.FileSystem;
import dev.juho.fileshare.client.client.io.Message;
import dev.juho.fileshare.client.client.io.Reader;
import dev.juho.fileshare.client.client.io.Writer;
import dev.juho.fileshare.client.utils.Log;

import java.io.IOException;
import java.net.Socket;

public class Client extends Thread {

	private final String address;
	private final int port;

	private Socket socket;

	private final FileSystem fileSystem;

	private Reader reader;
	private Writer writer;

	private ClientState clientState;

	private short clientId;

	private String httpToken;
	private String friendToken;

	public Client(FileSystem fileSystem, String address, int port) {
		this.clientState = ClientState.WAITING_FOR_CONNECTION;

		this.address = address;
		this.port = port;
		this.clientId = -1;
		this.fileSystem = fileSystem;

		this.httpToken = "NOT_ASSIGNED";
		this.friendToken = "NOT_ASSIGNED";
	}

	@Override
	public synchronized void start() {
		super.start();
	}

	public void connect() throws IOException {
		Log.i("Trying to connect to " + address + ":" + port);
		this.socket = new Socket(address, port);
		this.reader = new Reader(this);
		this.writer = new Writer(this);
		this.listen();
		updateClientState(ClientState.CONNECTED);

		this.reader.setListener(message -> {
			switch (message.getType()) {
				case Message.TYPE_HELLO_RESPONSE:
					clientIdReceivedFromServer(message);
					break;

				case Message.TYPE_USER_INFO:
					userInfoReceivedFromServer(message);
					break;
			}
		});

		writer.sendHello();
	}

	public void load() {
		clientId = fileSystem.readClientId();
	}

	public String createHttpToken() {
		if (!httpToken.equalsIgnoreCase("NOT_ASSIGNED")) {
			return httpToken;
		}

		String random = Double.toHexString(Math.random() * Integer.MAX_VALUE);
		httpToken = random;
		return random;
	}

	public boolean isValidToken(String token) {
		return token.equalsIgnoreCase(httpToken);
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

	public String getFriendToken() {
		return friendToken;
	}

	public void updateClientState(ClientState clientState) {
		this.clientState = clientState;
	}

	public Writer getWriter() {
		return writer;
	}

	public void saveClientId() {
		fileSystem.write("client_id.txt", Integer.toString(clientId));
	}

	private void initializeFileWrite(Message message) {
		// fileName,
		String payloadString = new String(message.getPayload());


	}

	private void userInfoReceivedFromServer(Message message) {
		// CSV: friendToken,
		String payloadString = new String(message.getPayload());
		friendToken = payloadString;
		Log.d("Got user data from server " + payloadString);
	}

	private void clientIdReceivedFromServer(Message message) {
		String payloadString = new String(message.getPayload());
		clientId = Short.parseShort(payloadString);
		Log.d("Got a client id from the server: " + clientId);
		saveClientId();
		getWriter().sendUserInfo();
	}

	private void listen() {
		clientState = ClientState.CONNECTED;
		reader.start();
		Log.i("Connected!");
	}
}
