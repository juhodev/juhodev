package dev.juho.fileshare.client.web;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import dev.juho.fileshare.client.client.Client;
import dev.juho.fileshare.client.utils.Log;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;

public class IndexHandler implements HttpHandler {
	private String template;
	private final Client client;

	private static final Pattern connectionStatePattern = Pattern.compile("\\.connectionState");
	private static final Pattern userHttpTokenPattern = Pattern.compile("\\.userHttpToken");
	private static final Pattern userFriendPattern = Pattern.compile("\\.friendToken");

	public IndexHandler(Client client) {
		this.client = client;
		this.template = "Hello world";

		try {
			loadTemplate();
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	@Override
	public void handle(HttpExchange exchange) throws IOException {
		String response = replaceTemplateStrings(template);
		Log.d("Client state seems to be :thonking: " + client.getClientState().toString());

		exchange.sendResponseHeaders(200, response.length());
		OutputStream os = exchange.getResponseBody();
		os.write(response.getBytes(StandardCharsets.UTF_8));
		os.close();
	}

	private void loadTemplate() throws IOException {
		File f = new File("dist/index.html");
		BufferedReader reader = new BufferedReader(new InputStreamReader(new FileInputStream(f)));

		StringBuilder builder = new StringBuilder();
		String line;
		while ((line = reader.readLine()) != null) {
			builder.append(line).append("\n");
		}

		template = builder.toString();
	}

	private String replaceTemplateStrings(String webPage) {
		return webPage
				.replaceAll(connectionStatePattern.pattern(), client.getClientState().toString())
				.replaceAll(userHttpTokenPattern.pattern(), client.createHttpToken())
				.replaceAll(userFriendPattern.pattern(), client.getFriendToken());
	}
}
