package dev.juho.fileshare.server.server;

import dev.juho.fileshare.server.server.client.Client;

import java.net.Socket;
import java.util.HashMap;

public class ClientPool {

	private final HashMap<Short, Client> clients;

	public ClientPool() {
		this.clients = new HashMap<>();
	}

	public void add(Socket socket) {
		Client client = new Client(socket);
		client.listen();

		short id = getIdForClient();
		client.setClientId(id);
		clients.put(id, client);
	}

	/**
	 * This currently only returns a random short. This should be made better and I should probably
	 * check for collisions (even if they're very unlikely).
	 *
	 * @return A random number positive short
	 */
	private short getIdForClient() {
		return (short) (Math.random() * Short.MAX_VALUE);
	}

}
