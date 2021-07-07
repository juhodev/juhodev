package dev.juho.fileshare.client.web;

import com.sun.net.httpserver.HttpServer;
import dev.juho.fileshare.client.client.Client;
import dev.juho.fileshare.client.utils.Log;

import java.io.IOException;
import java.net.InetSocketAddress;

public class WebServer {

	public void start(Client client) throws IOException {
		HttpServer server = HttpServer.create(new InetSocketAddress(8000), 0);
		Log.i("Http server running on port 8000");

		server.createContext("/", new IndexHandler(client));
		server.createContext("/connect", new ConnectHandler(client));
		server.setExecutor(null);
		server.start();

	}

}
