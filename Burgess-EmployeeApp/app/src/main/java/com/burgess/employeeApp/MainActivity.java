package com.burgess.employeeApp;

import android.app.Activity;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothManager;
import android.content.Context;
import android.content.Intent;
import android.net.ConnectivityManager;
import android.net.wifi.WifiManager;
import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentTransaction;
import android.support.v7.app.ActionBarActivity;
import android.view.*;
import android.widget.Button;
import android.widget.Toast;

import com.burgess.btTracking.BluetoothCollection;
import com.parse.Parse;
import com.parse.ParseInstallation;

import java.util.HashMap;

public class MainActivity extends ActionBarActivity
{
	private final static int REQUEST_ENABLE_BT = 55;

	private BluetoothCollection _bluetoothSignalCollector;

	@Override
	protected void onCreate(Bundle savedInstanceState)
	{
		super.onCreate(savedInstanceState);
		setContentView(com.burgess.employeeApp.R.layout.activity_main);

		Parse.initialize(this, "OHZhBe7qRjQWqz0IkKV9mOKXcb7yA4tRSgIvjQBC", "ewX4BAHgOaWrv3Q6z1thS6SlzR0oOosfMyeJnH2O");
		ParseInstallation.getCurrentInstallation().saveInBackground();

		if (savedInstanceState == null) {
			getSupportFragmentManager().beginTransaction()
					.add(R.id.container, new HomeFragment())
					.commit();
		}

		final BluetoothManager bluetoothManager = (BluetoothManager) getSystemService(Context.BLUETOOTH_SERVICE);
		BluetoothAdapter mBluetoothAdapter = bluetoothManager.getAdapter();

		if (mBluetoothAdapter == null)
		{
			Toast.makeText(getApplicationContext(), "Failed to get Bluetooth", Toast.LENGTH_LONG).show();
			return;
		}

		//asks user to enable Bluetooth for collection, if not already on
		if (!mBluetoothAdapter.isEnabled())
		{
			Intent enableBtIntent = new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE);
			startActivityForResult(enableBtIntent, REQUEST_ENABLE_BT);
		}

		WifiManager wifiManager = (WifiManager) getSystemService(Context.WIFI_SERVICE);
		ConnectivityManager connectivityManager = (ConnectivityManager) getSystemService(Activity.CONNECTIVITY_SERVICE);

		// TODO::TM hook this up to server DB
		HashMap<String, String> stationMacs = new HashMap<>();
		stationMacs.put("E4:98:D6:63:1D:86", "bt-stn1");

		_bluetoothSignalCollector = new BluetoothCollection(stationMacs,
				bluetoothManager,
				wifiManager,
				connectivityManager,
				getApplicationContext());
		_bluetoothSignalCollector.startCollection();
	}

	@Override
	public boolean onCreateOptionsMenu(Menu menu)
	{
		getMenuInflater().inflate(com.burgess.employeeApp.R.menu.main, menu);
		return true;
	}

	@Override
	public boolean onOptionsItemSelected(MenuItem item)
	{
		int id = item.getItemId();
		boolean wasHandled = false;
		switch (id)
		{
			case com.burgess.employeeApp.R.id.action_openBTView:
				wasHandled = true;
				Intent intent = new Intent(this, ViewBTActivity.class);
				startActivity(intent);
				break;
		}

		return wasHandled || super.onOptionsItemSelected(item);
	}

	/**
	 * A placeholder fragment containing a simple view.
	 */
	public static class HomeFragment extends Fragment {

		private Button _btnEmployee;
		private Button _btnCustomer;

		public HomeFragment() {}

		@Override
		public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
			View rootView = inflater.inflate(R.layout.fragment_main_activity, container, false);

			_btnEmployee = (Button) rootView.findViewById(R.id.btnEmployee);
			_btnCustomer = (Button) rootView.findViewById(R.id.btnCustomer);

			_btnEmployee.setOnClickListener(new View.OnClickListener() {
				@Override
				public void onClick(View view) {
					FragmentTransaction transaction = getFragmentManager().beginTransaction();
					transaction.replace(R.id.container, new LiveFeedFragment());
					transaction.setTransition(FragmentTransaction.TRANSIT_FRAGMENT_OPEN);
					transaction.addToBackStack(null);

					transaction.commit();
				}
			});
			_btnCustomer.setOnClickListener(new View.OnClickListener() {
				@Override
				public void onClick(View view) {
					FragmentTransaction transaction = getFragmentManager().beginTransaction();
					transaction.replace(R.id.container, new CustomerFragment());
					transaction.setTransition(FragmentTransaction.TRANSIT_FRAGMENT_OPEN);
					transaction.addToBackStack(null);

					transaction.commit();
				}
			});

			_btnCustomer.setOnTouchListener(new TransparentButtonListener());
			_btnEmployee.setOnTouchListener(new TransparentButtonListener());

			return rootView;
		}
	}

	public static class TransparentButtonListener implements View.OnTouchListener {
		@Override
		public boolean onTouch(View view, MotionEvent motionEvent) {
			switch (motionEvent.getAction()) {
				case MotionEvent.ACTION_DOWN:
				case MotionEvent.ACTION_HOVER_ENTER:
					view.setBackgroundColor(view.getResources().getColor(R.color.opacity_100));
					break;
				case MotionEvent.ACTION_UP:
				case MotionEvent.ACTION_HOVER_EXIT:
					view.setBackgroundColor(view.getResources().getColor(R.color.opacity_75));
					break;
			}
			return false;
		}
	}
}
