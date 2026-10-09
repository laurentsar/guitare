#!/usr/bin/env python3
"""Écran allumé pendant l'utilisation (android/ est régénéré à chaque build).

La permission WAKE_LOCK posée par patch_manifest.py ne suffit pas : l'écran
reste allumé seulement si la FENÊTRE porte le drapeau FLAG_KEEP_SCREEN_ON, et
la WebView d'Android n'expose pas toujours la Screen Wake Lock API au JS.

Ce script ajoute un petit plugin Capacitor, KeepAwake :
  - à son chargement (démarrage de l'app), il pose le drapeau : l'écran ne
    s'éteint plus tant que l'app est au premier plan, même avant que le JS
    ait fini de charger ;
  - keepAwake() / allowSleep() le posent / le retirent, pour le réglage
    « Écran allumé pendant l'utilisation » (www/ecran.js).
Le drapeau ne joue que pour l'activité visible : app rangée ou écran
verrouillé à la main, la veille redevient normale. Aucune permission
supplémentaire n'est nécessaire.

Doit tourner AVANT ci/patch_updater.py, qui chaîne son enregistrement après
celui de KeepAwakePlugin. Idempotent.
"""
import os

PKG = "com.laurent.guitare"
PKG_DIR = "android/app/src/main/java/com/laurent/guitare"

PLUGIN_JAVA = """package %s;

import android.view.WindowManager;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Garde l'écran allumé tant que l'application est au premier plan : on joue
 * de la guitare les deux mains prises, sans pouvoir toucher l'écran pour
 * l'empêcher de se mettre en veille. Piloté par www/ecran.js.
 */
@CapacitorPlugin(name = "KeepAwake")
public class KeepAwakePlugin extends Plugin {

    @Override
    public void load() {
        poser(true);
    }

    private void poser(final boolean allume) {
        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (allume) {
                    getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                } else {
                    getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                }
            }
        });
    }

    @PluginMethod
    public void keepAwake(PluginCall call) {
        poser(true);
        call.resolve();
    }

    @PluginMethod
    public void allowSleep(PluginCall call) {
        poser(false);
        call.resolve();
    }
}
""" % PKG


def write_if_changed(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if os.path.exists(path) and open(path).read() == content:
        print(path, ": inchangé")
        return
    open(path, "w").write(content)
    print(path, ": écrit")


def patch_main_activity():
    p = PKG_DIR + "/MainActivity.java"
    s = open(p).read()
    if "registerPlugin(KeepAwakePlugin.class)" in s:
        print("MainActivity.java : KeepAwakePlugin déjà enregistré")
        return
    # registerPlugin doit précéder super.onCreate : on se place juste avant.
    if "super.onCreate(savedInstanceState);" in s:
        s = s.replace("super.onCreate(savedInstanceState);",
                      "registerPlugin(KeepAwakePlugin.class);\n        super.onCreate(savedInstanceState);", 1)
        open(p, "w").write(s)
        print("MainActivity.java : KeepAwakePlugin enregistré")
        return
    s2 = s.replace(
        "public class MainActivity extends BridgeActivity {}",
        "public class MainActivity extends BridgeActivity {\n"
        "    @Override\n"
        "    public void onCreate(android.os.Bundle savedInstanceState) {\n"
        "        registerPlugin(KeepAwakePlugin.class);\n"
        "        super.onCreate(savedInstanceState);\n"
        "    }\n"
        "}")
    if s2 == s:
        raise SystemExit("MainActivity.java : point d'insertion introuvable")
    open(p, "w").write(s2)
    print("MainActivity.java : KeepAwakePlugin enregistré (activité nue)")


write_if_changed(PKG_DIR + "/KeepAwakePlugin.java", PLUGIN_JAVA)
patch_main_activity()
