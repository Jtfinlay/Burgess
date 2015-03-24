package com.burgess.employeeApp;

import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

public class LiveFeedFragment extends Fragment {

    private WebView _webView;
    public LiveFeedFragment() {}

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View rootView = inflater.inflate(R.layout.fragment_live_feed, container, false);

        _webView = (WebView) rootView.findViewById(R.id.webView);
        _webView.getSettings().setJavaScriptEnabled(true);
        _webView.loadUrl("http://ua-bws.cloudapp.net/livefeed_mobile");

        return rootView;
    }
}
