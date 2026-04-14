def __init__(*args):
    # TODO: implement
    pass

# Sample calls
print(__init__(*[["TimeMap", "set", "get", "get", "set", "get", "get"], [[], ["foo", "bar", 1], ["foo", 1], ["foo", 3], ["foo", "bar2", 4], ["foo", 4], ["foo", 5]]]))
print(__init__(*[["TimeMap", "get"], [[], ["key", 1]]]))
print(__init__(*[["TimeMap", "set", "get"], [[], ["a", "val", 1], ["a", 1]]]))
