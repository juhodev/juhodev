package dev.juho.fileshare.server.log;

public class Log {

	public static void d(Object o) {
		System.out.println("[Debug] " + o);
	}

	public static void e(Object o) {
		System.err.println("[Error] " + o);
	}

	public static void i(Object o) {
		System.out.println("[Info] " + o);
	}

}
