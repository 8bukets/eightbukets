const { debounce } = require('./app.js');

jest.useFakeTimers();

describe('debounce', () => {
    test('should execute just once', () => {
        const func = jest.fn();
        const debouncedFunc = debounce(func, 300);

        // Call it several times
        for (let i = 0; i < 100; i++) {
            debouncedFunc();
        }

        // Fast-forward time
        jest.runAllTimers();

        expect(func).toHaveBeenCalledTimes(1);
    });

    test('should pass arguments to the original function', () => {
        const func = jest.fn();
        const debouncedFunc = debounce(func, 300);

        debouncedFunc('test', 123);

        jest.runAllTimers();

        expect(func).toHaveBeenCalledWith('test', 123);
    });

    test('should execute again after wait time has passed', () => {
        const func = jest.fn();
        const debouncedFunc = debounce(func, 300);

        debouncedFunc();
        jest.advanceTimersByTime(300);
        expect(func).toHaveBeenCalledTimes(1);

        debouncedFunc();
        jest.advanceTimersByTime(300);
        expect(func).toHaveBeenCalledTimes(2);
    });
});
