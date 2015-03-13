package com.example.burgess_employeeapp;

import java.util.ArrayList;

import android.bluetooth.BluetoothManager;
import android.content.Context;
import android.net.ConnectivityManager;
import android.net.wifi.WifiManager;
import android.os.PowerManager;

public class BluetoothMetadataThread extends Thread {
	private ArrayList<Result> mResults;
	private BluetoothCollection mBTCollector;
	private BluetoothSendMetaData mBTSender;

	private Object mSyncToken = new Object();
	private PowerManager.WakeLock mWakeLock;

	public BluetoothMetadataThread (BluetoothManager bluetoothManager, WifiManager wifiManager, ConnectivityManager connMgr, MainActivity self)
	{
		mBTCollector = new BluetoothCollection(bluetoothManager, wifiManager, connMgr, self, this, mSyncToken);
		mBTSender = new BluetoothSendMetaData();
		
		//runs cpu in background to transmit location data while phone is asleep
		PowerManager pm = (PowerManager)self.getApplicationContext().getSystemService(Context.POWER_SERVICE);
		mWakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "WakeLock");
	}

	public void run() {
		while (true)
		{
			mWakeLock.acquire();

			synchronized(mSyncToken)
			{
				try {
					mResults = new ArrayList<Result>();
					mBTCollector.startCollection(mResults);
					mSyncToken.wait();
					mBTSender.POST(mResults);
					
				} catch (InterruptedException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
		}
	}

	public void addResult(Result newResult) {
		mResults.add(newResult);
	}
}
