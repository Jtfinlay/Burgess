package com.burgess.employeeApp;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;

import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.DefaultHttpClient;
import org.json.JSONArray;

import android.util.Log;

public class BluetoothSendMetaData {
	private final String url = "http://192.168.0.22:9000/rawBluetooth";

	@SuppressWarnings("deprecation")
	public boolean POST(ArrayList<Result> results){
		if (results.isEmpty())
			return false;
		
		InputStream inputStream = null;
		boolean result = false;
		try {

			// 1. create HttpClient
			HttpClient httpclient = new DefaultHttpClient();

			// 2. make POST request to the given URL
			HttpPost httpPost = new HttpPost(url);

			String json = "";
			
			// 3. build jsonObject
			JSONArray jsonArray = new JSONArray();
			for (int i = 0; i < results.size(); i++)
			{
				jsonArray.put(results.get(i).getJSON());
			}

			// 4. convert JSONObject to JSON to String
			json = jsonArray.toString();

			// 5. set json to StringEntity
			StringEntity se = new StringEntity(json);

			// 6. set httpPost Entity
			httpPost.setEntity(se);

			// 7. Set some headers to inform server about the type of the content   
			httpPost.setHeader("Accept", "application/json");
			httpPost.setHeader("Content-type", "application/json");

			// 8. Execute POST request to the given URL
			HttpResponse httpResponse = httpclient.execute(httpPost);

			// 9. receive response as inputStream
			inputStream = httpResponse.getEntity().getContent();

			// 10. convert inputstream to string
			if(inputStream != null)
			{
				@SuppressWarnings("unused") //for debugging
				String replyString = convertInputStreamToString(inputStream);
				result = true;
			}
			else
				result = false;

		} catch (Exception e) {
			Log.d("InputStream", e.getLocalizedMessage());
		}

		// 11. return result
		return result;
	}

	private static String convertInputStreamToString(InputStream inputStream) throws IOException{
		BufferedReader bufferedReader = new BufferedReader( new InputStreamReader(inputStream));
		String line = "";
		String result = "";
		while((line = bufferedReader.readLine()) != null)
			result += line;

		inputStream.close();
		return result;

	}
}
