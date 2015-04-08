package com.burgess.btTracking;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.wifi.WifiManager;
import android.os.AsyncTask;

import org.json.JSONArray;

import java.io.*;
import java.net.*;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;

public final class BluetoothCollection
{
	// Singletons are awful... but because Android this is the simplest way to do this
	public static BluetoothCollection Instance;

	private HashMap<String, String> m_stationMacs;
	private String m_localMacAddress;
    private String m_url;

	private BluetoothAdapter m_bluetoothAdapter;
	private BroadcastReceiver m_receiver;
	private Context m_context;

	private ArrayList<BluetoothListener> m_listeners = new ArrayList<>();

	private boolean m_errors = false;

	public BluetoothCollection(BluetoothAdapter bluetoothAdapter,
	                           WifiManager wifiManager,
	                           ConnectivityManager connMgr,
	                           Context context,
                               String url)
	{
        m_stationMacs = new HashMap<>();
        m_url = url;
        BluetoothStationGet sender = new BluetoothStationGet();
        sender.executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR, m_stationMacs);

		m_bluetoothAdapter = bluetoothAdapter;
		m_context = context;

		//wifi needs to be enabled to get the MAC.
		boolean previousState = wifiManager.isWifiEnabled();
		wifiManager.setWifiEnabled(true);
		m_localMacAddress = wifiManager.getConnectionInfo().getMacAddress();
		wifiManager.setWifiEnabled(previousState);

		m_receiver = new BluetoothReceiver();

		if (!isConnected(connMgr))
		{
			m_errors = true;
		}

		Instance = this;
	}

	public void startCollection()
	{
		IntentFilter filter = new IntentFilter();
		filter.addAction(BluetoothDevice.ACTION_FOUND);
		filter.addAction(BluetoothAdapter.ACTION_DISCOVERY_FINISHED);
		m_context.registerReceiver(m_receiver, filter);

		m_bluetoothAdapter.startDiscovery();
	}

	public boolean hasErrors()
	{
		return m_errors;
	}

	private boolean isConnected(ConnectivityManager connMgr)
	{
		NetworkInfo networkInfo = connMgr.getActiveNetworkInfo();
		return networkInfo != null && networkInfo.isConnected();
	}

	public void ListenForData(BluetoothListener listener)
	{
		m_listeners.add(listener);
	}

	public void RemoveListener(BluetoothListener listener)
	{
		m_listeners.remove(listener);
	}

	private void PublishData(HashMap<String, Result> data)
	{
		for (BluetoothListener listener : m_listeners)
		{
			listener.OnDataReady(data);
		}
	}

	public interface BluetoothListener
	{
		void OnDataReady(HashMap<String, Result> results);
	}

	private class BluetoothReceiver extends BroadcastReceiver
	{
		private final int MAX_COUNT = 3;
		private final long TIME_OUT = 15000;

		private int m_count = 0;
		private HashMap<String, Result> m_results = new HashMap<>();

		public void onReceive(Context context, Intent intent)
		{
			String action = intent.getAction();
			if (BluetoothDevice.ACTION_FOUND.equals(action))
			{
				BluetoothDevice device = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
				int rssi = intent.getShortExtra(BluetoothDevice.EXTRA_RSSI, Short.MIN_VALUE);
				Calendar time = Calendar.getInstance();

				if (m_stationMacs.containsKey(device.getAddress()))
				{
					m_count++;
					String station = m_stationMacs.get(device.getAddress().toUpperCase());
					if (m_results.containsKey(station))
					{
						m_results.get(station).setSignalStrength(rssi);
						m_results.get(station).setTime(time.getTime());
					}
					else
					{
						m_results.put(station,
								new Result(m_localMacAddress,
										station,
										rssi,
										time.getTime()));
					}
					if (m_count == MAX_COUNT)
					{
						locationFound(context);
					}
				}
			}
			else if (BluetoothAdapter.ACTION_DISCOVERY_FINISHED.equals(action))
			{
				startNewBTScan(context);
			}
		}

		private void locationFound(Context context)
		{
			m_bluetoothAdapter.cancelDiscovery();
			startNewBTScan(context);
		}

		private void startNewBTScan(Context context)
		{
			context.unregisterReceiver(m_receiver);
			PublishData(m_results);

			Result max = null;
			for (Result r : m_results.values())
			{
				if (max == null || r.getSignalStrength() > max.getSignalStrength())
				{
					max = r.clone();
				}
			}
			if (max != null)
			{
				BluetoothSendMetaData sender = new BluetoothSendMetaData(m_url);
				ArrayList<Result> temp = new ArrayList<>();
				temp.add(max);
				sender.executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR, temp);
			}

			ArrayList<String> removeList = new ArrayList<>();
			for(Result r : m_results.values())
			{
				if(r.getTime().getTime() - Calendar.getInstance().getTime().getTime() > TIME_OUT)
				{
					removeList.add(r.getSource());
				}
			}

			for(String r : removeList)
			{
				m_results.remove(r);
			}

			m_count = 0;
			startCollection();
		}
	}

    private class BluetoothStationGet extends AsyncTask<HashMap<String, String>, Void, Boolean>
    {
        private void getStations(HashMap<String, String> stationList, String baseURL) {
            URL url;
            HttpURLConnection conn;
            BufferedReader rd;
            String line;
            String result = "";
            try {
                url = new URL(baseURL + "/bluetoothStations");
                conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                rd = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                while ((line = rd.readLine()) != null) {
                    result += line;
                }
                rd.close();
            } catch (Exception e) {
                e.printStackTrace();
            }

            try {
                JSONArray jsArray = new JSONArray(result);
                for (int i = 0; i < jsArray.length(); i++)
                {
                    String mac = jsArray.getJSONObject(i).getString("mac");
                    String id = jsArray.getJSONObject(i).getString("id");
                    stationList.put(mac,id);
                }
            }
            catch (Exception e)
            {
                e.printStackTrace();
            }
        }

        @Override
        protected Boolean doInBackground(HashMap<String, String>... params)
        {
            getStations(m_stationMacs, m_url);
            return true;
        }
    }
}