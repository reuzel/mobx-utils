import { observable, runInAction } from "mobx"
import { whenValue } from "../src/whenValue"

test("Should wait for value", async () => {
    const store = observable({ foo: "" })

    const promise = whenValue(
        () => store.foo,
        (foo) => foo.indexOf("b") >= 0
    )
    setImmediate(() => {
        runInAction(() => {
            store.foo = "bar"
        })
    })

    return expect(promise).resolves.toEqual("bar")
})

test("Should ignore non matching value", async () => {
    const store = observable({ foo: "" })

    const promise = whenValue(
        () => store.foo,
        (foo) => foo.indexOf("b") >= 0
    )
    setImmediate(() => {
        runInAction(() => {
            store.foo = "hello"
        })

        runInAction(() => {
            store.foo = "bar"
        })
    })

    return expect(promise).resolves.toEqual("bar")
})

test("Should resolve when value becomes available", async () => {
    const store = observable({ foo: "", bar: undefined })

    const promise = whenValue(() => store.bar)
    setImmediate(() => {
        runInAction(() => {
            store.bar = undefined
        })

        runInAction(() => {
            store.bar = "hello"
        })
    })

    return expect(promise).resolves.toEqual("hello")
})

test("Should resolve when item gets added to map", async () => {
    const store = observable(new Map<string, string>())

    const promise = whenValue(() => store.get("but"))
    setImmediate(() => {
        runInAction(() => {
            store.set("no no", "not this one")
        })

        runInAction(() => {
            store.set("but", "this one")
        })
    })

    return expect(promise).resolves.toEqual("this one")
})

test("Should reject when generator throws error", async () => {
    const error = new Error("Yikes!")

    const promise = whenValue(() => {
        throw error
    })

    return expect(promise).rejects.toEqual(error)
})

test("Should reject when predicate throws error", async () => {
    const store = observable({ foo: "bar" })

    const error = new Error("Yikes!")

    const promise = whenValue(
        () => store.foo,
        (value) => {
            throw error
        }
    )

    return expect(promise).rejects.toEqual(error)
})

test("Should reject when cancelled", async () => {
    const store = observable({ foo: "bar" })

    const promise = whenValue(
        () => store.foo,
        (value) => value == "hello"
    )

    promise.cancel()

    return expect(promise).rejects.toEqual("WHEN_VALUE_CANCELLED")
})

test("Cancel after resolve has no effect", async () => {
    const store = observable({ foo: 10 })

    const promise = whenValue(
        () => store.foo,
        (value) => value > 5
    )

    promise.cancel()

    return expect(promise).resolves.toEqual(10)
})
