var app = angular.module("WordWalk",[]);

app.controller('Controller', ['$scope', "$http", function($scope, $http) {
    $scope.dimensions = [16, 8, 4];
    $scope.selected_dimension = 16;
    $scope.steps = 10;
    $scope.neighbours = 3;
    $scope.neighbours_indecies = [];
    $scope.start_word = "";
    $scope.end_word = "";
    $scope.error = "";
    $scope.results = [];

    let embeddings = {};
    

    function load_embeddings(dimension, vocab) {
        if (vocab.length == 0 || embeddings[vocab[0]].length != dimension) {
            console.log("Loading Embeddings");
            $http.get('embeddings/cc.en.10k.'+dimension+'d.vec').success(function(data) {
                lines = data.split("\n");
                lines.forEach(line => {
                    tokens = line.split(" ");
                    let embedding = [];
                    for(let i = 1; i<tokens.length; i++)
                        embedding.push(parseFloat(tokens[i]));
                    embeddings[tokens[0]] = embedding;
                });
            });
        }
    }

    function is_oov(vocab, word) {
        for(let i = 0; i<vocab.length; i++)
            if (vocab[i] == word) 
                return false;
        return true;
    }

    function check_words(vocab) {
        if (is_oov(vocab, $scope.start_word.trim())){
            $scope.error = "OOV Error! " + $scope.start_word + " not in vocab."
            return false;
        }
        if (is_oov(vocab, $scope.end_word.trim())){
            $scope.error = "OOV Error! " + $scope.end_word + " not in vocab."
            return false;
        }
        return true;
    }

    function linspace(start, end, num){
        let steps = []
        let step = end / (num);
        while(start < end){
            steps.push(start);
            start += step;
        }
        return steps;
    }

    function lerp(a, b, t) {
        let x = [];
        for(let i = 0; i < a.length; i++)
            x.push(a[i] + t * (b[i] - a[i]));
        return x;
    }

    function compute_distance(a, b) {
        let distance = 0;
        for(let i = 0; i<a.length; i++)
            distance += (Math.pow(a[i]-b[i], 2));
        return Math.sqrt(distance);
    }

    function find_nearest_neighbours(vector) {
        let nearest_words = [];
        for(let word in embeddings) {
            let embedding = embeddings[word];
            let dist = compute_distance(embedding, vector);
            nearest_words.push({value:word, distance:dist});
        }

        nearest_words.sort(function(a, b) {
            return ((a.distance < b.distance) ? -1 : ((a.distance == b.distance) ? 0 : 1));
        });
        
        return nearest_words.slice(0, $scope.neighbours);
    }

    function linear_interpolation() {
        let words = [];
        let start_vector = embeddings[$scope.start_word];
        let end_vector = embeddings[$scope.end_word];
        let steps = linspace(0, 1, $scope.steps);
        steps.forEach(alpha => {
            let vector = lerp(start_vector, end_vector, alpha);
            let nearest_neighbours = find_nearest_neighbours(vector);
            words.push(nearest_neighbours);
        });
        return words;
    }

    $scope.run = function() {
        $scope.results = [];
        $scope.neighbours_indecies = [];
        for(let i = 1; i<$scope.neighbours; i++)
            $scope.neighbours_indecies.push(i);

        let vocab = Object.keys(embeddings);
        load_embeddings($scope.selected_dimension, vocab);
        if(check_words(vocab)) {
            $scope.results = linear_interpolation();
        }
    };

    load_embeddings($scope.selected_dimension, []);

}]);
    
