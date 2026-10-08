package io.github.znammous.nuralwahy;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(TilawaPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
