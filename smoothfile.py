import modeltosrc
import reflect

import os;

def _default(*args):
    return True

def _reflect():
    return reflect.reflectSource(os.path.join("models","core"), os.path.join("gen", "core"))

def _translatecpp():
    return modeltosrc.translatecpp(os.path.join("models","core"), "gen", "core")

def _translatets():
    return modeltosrc.translatets(os.path.join("models","core"), "gen", "core")

def _gen():
    if _reflect():
        return _translatets()
    return False