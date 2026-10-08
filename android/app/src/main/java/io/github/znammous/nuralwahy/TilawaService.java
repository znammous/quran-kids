package io.github.znammous.nuralwahy;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;

/* خدمةُ التلاوة الأماميّة: لا تُشغّل صوتاً بنفسها — الصوتُ من الصفحة — وإنّما
   تُعلم النظامَ أنّ التطبيقَ يتلو فلا يجمّده. وإشعارُها يفتح التطبيق. */
public class TilawaService extends Service {
    static final String CH = "tilawa";
    static final int ID = 7101;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String title = intent != null ? intent.getStringExtra("title") : null;
        String text = intent != null ? intent.getStringExtra("text") : null;
        String chName = intent != null ? intent.getStringExtra("channel") : null;
        if (chName == null || chName.isEmpty()) chName = "Recitation";

        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26 && nm != null) {
            NotificationChannel ch = new NotificationChannel(CH, chName, NotificationManager.IMPORTANCE_LOW);
            ch.setShowBadge(false);
            nm.createNotificationChannel(ch);
        }

        Intent open = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent pi = open == null ? null : PendingIntent.getActivity(this, 0, open,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0));

        Notification n = new NotificationCompat.Builder(this, CH)
            .setSmallIcon(getApplicationInfo().icon)
            .setContentTitle(title == null || title.isEmpty() ? getString(R.string.app_name) : title)
            .setContentText(text == null ? "" : text)
            .setContentIntent(pi)
            .setOngoing(true)
            .setSilent(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build();

        try {
            ServiceCompat.startForeground(this, ID, n,
                Build.VERSION.SDK_INT >= 29 ? ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK : 0);
        } catch (Exception e) {
            stopSelf();
        }
        return START_NOT_STICKY;
    }

    /* أُغلق التطبيقُ من قائمة التطبيقات: لا يبقى إشعارٌ بلا تلاوة */
    @Override
    public void onTaskRemoved(Intent rootIntent) {
        stopSelf();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
