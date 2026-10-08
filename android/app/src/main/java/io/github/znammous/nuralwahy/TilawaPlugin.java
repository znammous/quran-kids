package io.github.znammous.nuralwahy;

import android.content.Intent;
import android.os.Build;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/* التلاوةُ والشاشةُ مقفلة: أندرويد يجمّد التطبيقَ في الخلفيّة، فتُتمّ الآيةُ
   الجارية صوتَها ولا يجري ما يُشغّل التالية. فما دامت التلاوة قائمةً تعمل
   خدمةُ تشغيلٍ أماميّة تُبقيه حيّاً، وتُطوى معها. */
@CapacitorPlugin(name = "Tilawa")
public class TilawaPlugin extends Plugin {

    @PluginMethod
    public void start(PluginCall call) {
        Intent i = new Intent(getContext(), TilawaService.class);
        i.putExtra("title", call.getString("title", ""));
        i.putExtra("text", call.getString("text", ""));
        i.putExtra("channel", call.getString("channel", ""));
        try {
            if (Build.VERSION.SDK_INT >= 26) getContext().startForegroundService(i);
            else getContext().startService(i);
            call.resolve();
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        try {
            getContext().stopService(new Intent(getContext(), TilawaService.class));
        } catch (Exception e) {}
        call.resolve();
    }
}
