package dev.juho.fileshare.client.web;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import dev.juho.fileshare.client.client.Client;
import dev.juho.fileshare.client.utils.Log;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

public class ConnectHandler implements HttpHandler {

	private final Client client;

	public ConnectHandler(Client client) {
		this.client = client;
	}

	@Override
	public void handle(HttpExchange exchange) throws IOException {
		Log.d("Http request: " + exchange.getRequestMethod() + " " + exchange.getRequestURI());

		if (exchange.getRequestMethod().equalsIgnoreCase("POST")) {
			BufferedReader reader = new BufferedReader(new InputStreamReader(exchange.getRequestBody()));

			StringBuilder builder = new StringBuilder();
			String line;
			while ((line = reader.readLine()) != null) {
				builder.append(line);
			}

			String full = builder.toString();
			Log.d("full: " + full);
			if (full.contains("token=")) {
				String[] split = full.split("token=");
				String token = split[1];

				if (client.isValidToken(token)) {
					Log.d(token + " was a valid token");
					client.connect();
					exchange.sendResponseHeaders(200, 0);
					return;
				} else {
					Log.d(token + " was NOT a valid token");
				}
			}
		}

		exchange.sendResponseHeaders(403, 0);
	}
}
