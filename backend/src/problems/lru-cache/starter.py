def __init__(*args):
    # TODO: implement
    pass

# Sample calls
print(__init__(*[["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"], [[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]]))
print(__init__(*[["LRUCache", "get", "put", "get", "put", "put", "get", "get"], [[2], [2], [2, 6], [1], [1, 5], [1, 2], [1], [2]]]))
print(__init__(*[["LRUCache", "put", "get", "put", "get", "get"], [[1], [2, 1], [2], [3, 2], [2], [3]]]))
