import modeltosrc
import reflect

import os;

def _default(*args):
    return True

def _reflect():
    return reflect.reflectSource("model/core", os.path.join("gen", "core"))

def _translatecpp():
    return modeltosrc.translatecpp("models/core", "gen", "core")

def _translatets():
    return modeltosrc.translatets("models/core", "gen", "core")

def _gen():
    _reflect()
    _translatets()