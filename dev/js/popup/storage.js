module.exports = new function() {
    this.getItem = name => {
        return localStorage[name];
    };

    this.setItem = (name, value) => {
        localStorage.setItem(name, value);
    };

    this.removeItem = name => {
        localStorage.removeItem(name);
    };

    this.clearAll = () => {
        localStorage.clear();
    };
}();
