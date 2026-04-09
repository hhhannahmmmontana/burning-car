import { Joke } from "src/domain/entities/joke.entity";

export class UserJoke extends Joke {
    private constructor() {
        super();
    }

    isFavourite: boolean = false;
    userRating: number | null = null;

    static fromJokeUnauthorized(joke: Joke): UserJoke {
        const userJoke = new UserJoke();
        userJoke.id = joke.id;
        userJoke.text = joke.text;
        userJoke.tags = joke.tags;
        userJoke.rating = joke.rating;
        userJoke.ratesAmount = joke.ratesAmount;
        userJoke.author = joke.author;
        userJoke.createdAt = joke.createdAt;
        return userJoke;
    }

    static fromJoke(
        joke: Joke, 
        isFavourite: boolean, 
        userRating: number | null
    ): UserJoke {
        const userJoke = UserJoke.fromJokeUnauthorized(joke);
        userJoke.isFavourite = isFavourite;
        userJoke.userRating = userRating;
        return userJoke;
    }
}