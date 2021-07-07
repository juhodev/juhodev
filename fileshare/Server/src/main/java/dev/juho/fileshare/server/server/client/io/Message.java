package dev.juho.fileshare.server.server.client.io;

import java.nio.ByteBuffer;
import java.util.Arrays;

public class Message {

	public static final byte CONTENT_TYPE_TEXT = 0x0;
	public static final byte CONTENT_TYPE_BINARY = 0x1;

	public static final byte TYPE_DEBUG_MESSAGE = 0x0;
	public static final byte TYPE_HELLO = 0x1;
	public static final byte TYPE_HELLO_RESPONSE = 0x2;
	public static final byte TYPE_NEW_FILE = 0x3;
	public static final byte TYPE_FILE_TRANSFER = 0x4;
	public static final byte TYPE_USER_INFO = 0x5;

	//
	// Note: This message structure can't be used for anything else than the POC.
	// For that I need to swap the client id with an authentication token or something
	// like that.
	//
	// + ----------------------------- + -------------- + ---------------- +
	// |          Length (16)          |    Type (8)    | Content-Type (8) |
	// +------------------------------ + ---------------+----------------- +
	// |        Client Id (16)         |          Payload (0...)           |
	// + ----------------------------- + --------------------------------- +
	//

	private final short payloadLength, clientId;
	private final byte type, contentType;
	private final byte[] payload;

	public Message(short payloadLength, byte type, byte contentType, short clientId, byte[] payload) {
		this.payloadLength = payloadLength;
		this.type = type;
		this.contentType = contentType;
		this.clientId = clientId;
		this.payload = payload;
	}

	public static Message read(byte[] data) {
		ByteBuffer buffer = ByteBuffer.wrap(data);

		short payloadLength = buffer.getShort(0);
		byte type = buffer.get(2);
		byte contentType = buffer.get(3);
		short clientId = buffer.getShort(4);
		byte[] payload = new byte[payloadLength];
		System.arraycopy(data, 6, payload, 0, payloadLength);

		return new Message(payloadLength, type, contentType, clientId, payload);
	}

	public byte[] toByteArray() throws Exception {
		if (payload.length > Short.MAX_VALUE) {
			throw new Exception("Payload is too big!");
		}

		ByteBuffer buffer = ByteBuffer.allocate(16 + 8 + 8 + 16 + payloadLength);

		buffer.putShort(payloadLength);
		buffer.put(type);
		buffer.put(contentType);
		buffer.putShort(clientId);
		buffer.put(payload);

		return buffer.array();
	}

	@Override
	public String toString() {
		String payloadStr;
		if (contentType == CONTENT_TYPE_TEXT) {
			payloadStr = new String(payload);
		} else {
			payloadStr = Arrays.toString(payload);
		}

		return "Message{" +
				"payloadLength=" + payloadLength +
				", clientId=" + clientId +
				", type=" + type +
				", contentType=" + contentType +
				", payload=" + payloadStr +
				'}';
	}

	public byte getContentType() {
		return contentType;
	}

	public byte getType() {
		return type;
	}

	public byte[] getPayload() {
		return payload;
	}

	public short getClientId() {
		return clientId;
	}

	public short getPayloadLength() {
		return payloadLength;
	}
}
