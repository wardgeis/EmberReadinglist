App = Ember.Application.create();

App.Router.map(function() {
  // put your routes here
  this.resource('book', { path: '/books/:book_id'});
  this.resource('genre', { path: '/genres/:genre_id'});
  this.resource('login');
  this.resource('reviews', function() {
    this.route('new');
  });
});

App.IndexRoute = Ember.Route.extend({
  model: function() {
    return Ember.RSVP.hash({
      books: this.store.findAll('book'),
      genres: this.store.findAll('genre')
    });
  },
  setupController: function(controller, model) {
    controller.set('books', model.books);
    controller.set('genres', model.genres);
  }
});

App.AuthController = Ember.Controller.extend({
  authed: false,
  currentUser: null,

  init: function() {
    this.authClient = new FirebaseSimpleLogin(dbRef, function(error, user) {
      if (error) {
        alert('Authentication failed: ' + error);
      } else if (user) {
        this.set('authed', true);
        var userRef = new Firebase(usersPath + '/simplelogin:' + user.id);
        var controller = this;
        var properties = {
            id: user.id,
            email: user.email
        };
        userRef.once('value', function(snapshot) {
            var data = snapshot.val();
            var user = App.User.create({ ref: data});
            user.setProperties(properties);
            controller.set('currentUser', user);
        });
      } else {
        this.set('authed', false);
      }
    }.bind(this));
  },

    login: function() {
        console.log('made it inside login');
        console.log(email.value);       
        console.log(password.value);
        console.log(remember.value);
        this.authClient.login('password', {
            email: email.value,
            password: password.value,
            rememberMe: remember.value
        });
    },

    logout: function() {
        this.authClient.logout();
    },

    createUser: function() {
        console.log('made it inside createUser');
        var email = createEmail.value;
        console.log(email);
        var password = createPassword.value;
        console.log(password);
        this.authClient.createUser(email, password, function(error, user) {
            if (!error) {
                console.log('User Id: ' + user.id + ', Email: ' + user.email);
                var userRef = new Firebase(usersPath + '/simplelogin:' + user.id);
                userRef.set({
                    email: user.email,
                    id: user.id
                });
            }
        }
    )}
});

App.IndexController = Ember.Controller.extend({});

App.BooksController = Ember.ArrayController.extend({
  sortProperties: ['title']
});
App.GenresController = Ember.ArrayController.extend({
  sortProperties: ['name']
});


App.ReviewsNewRoute = Ember.Route.extend({
  model: function() {
    return Ember.RSVP.hash({
      book: this.store.createRecord('book'),
      genres: this.store.findAll('genre')
    });
  },
  setupController: function(controller, model) {
    controller.set('model', model.book);
    controller.set('genres', model.genres);
  },
  actions: {
    willTransition: function(transition) {
      if(this.currentModel.book.get('isNew')) {
        if(confirm("Are you sure you want to abandon progress?")) {
          this.currentModel.book.destroyRecord();
        } else {
          transition.abort();
        }
      }
    }
  }
});
App.ReviewsNewController = Ember.Controller.extend({
  ratings: [5,4,3,2,1],
  actions: {
    createReview: function() {
      var controller = this;
      this.get('model').save().then(function(model) {
        var genre = model.get('genre');
        genre.get('books').then(function(books){
          books.pushObject(model);
          genre.save();
          controller.transitionToRoute('index');
        });
      });
    }
  }
});

App.ApplicationAdapter = DS.FirebaseAdapter.extend({
  firebase: new Firebase("https://readinglist.firebaseio.com")
});

App.BookDetailsComponent = Ember.Component.extend({
  classNameBindings: ['ratingClass'],
  ratingClass: function() {
    return "rating-" + this.get('book.rating');
  }.property('book.rating')
});

App.Book = DS.Model.extend({
  title: DS.attr(),
  author: DS.attr(),
  review: DS.attr(),
  rating: DS.attr('number'),
  amazon_id: DS.attr(),
  genre: DS.belongsTo('genre'),
  url: function() {
    return "http://www.amazon.com/gp/product/"+this.get('amazon_id')+"/adamfortuna-20";
  }.property('amazon_id'),
  image: function() {
    return "http://images.amazon.com/images/P/"+this.get('amazon_id')+".01.ZTZZZZZZ.jpg";
  }.property('amazon_id')
});

App.Genre = DS.Model.extend({
  name: DS.attr(),
  books: DS.hasMany('book', {async: true})
});

App.User = DS.Model.extend({
  email: DS.attr('email'),
  password: DS.attr(),
});

//App.User = EmberFire.Object.extend({
//
//});

/*App.Book.FIXTURES = [
  {
    id: 1,
    title: 'Mindstorms',
    author: 'Seymour A. Papert',
    review: 'Although this book focuses on the cognitive advantages to having children use technology from an early age, it is also an in depth look at how people can learn for themseves. As someone who was often distracted and bored at times during school, Mindstorms highlights some of the reasoning behind that feeling and what we can do as teachers to help minimize it.',
    rating: 5,
    amazon_id: '0465046746',
    genre: 3
  },
  {
    id: 2,
    title: 'Hyperion',
    author: 'Dan Simmons',
    review: "Probably my favorite science fiction book (and series) I've ever read. Hyperion is written in a style similar to The Canterbury Tales, in which a series of stories are told by the main characters. Each story is a gem in itself, but alude to the larger storyline. The scope of the story is ambitious - spanning time, planets religion and love.",
    rating: 5,
    amazon_id: '0553283685',
    genre: 1
  },
  {
    id: 3,
    title: "Jony Ive: The Genius Behind Apple's Greatest Products",
    author: 'Leander Kahney',
    review: "Even though I respect Ive, I felt this biography only hit skin deep. It went over all the major events in his life, his passion for design, awards he achieved -- but that's really it. I dont't feel I know him anymore than before reading this.",
    rating: 2,
    amazon_id: '159184617X',
    genre: 3
  }
]; */

/* App.Genre.FIXTURES = [
  {
    id: 1,
    name: 'Science Fiction',
    books: [2]
  },
  {
    id: 2,
    name: 'Fiction'
  },
  {
    id: 3,
    name: 'Non-Fiction',
    books: [1,3]
  }
]; */