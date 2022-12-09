import modeltosrc
import reflect

import os;

PATH_MODELS_CORE = os.path.join("models","core")
PATH_GEN = os.path.join("src", "gen")

def _default(*args):
    return True

def _reflect():
    return reflect.reflectSource(PATH_MODELS_CORE, os.path.join(PATH_GEN, "core"))

def _translatecpp():
    return modeltosrc.translatecpp(PATH_MODELS_CORE, PATH_GEN, "core")

def _translatets():
    return modeltosrc.translatets(PATH_MODELS_CORE, PATH_GEN, "core")

def _gen():
    if _reflect():
        return _translatets()
    return False