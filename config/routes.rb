Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # API routes
  namespace :api do
    resources :players, only: [:create]
    resource :game_state, only: [:show, :create] do
      post :transition_to_results, on: :collection
    end
    resources :spins, only: [:create, :show] do
      member do
        patch :apply_bonus
      end
    end
    get :leaderboard, to: 'leaderboard#index'
  end

  # Defines the root path route ("/")
  # root "posts#index"
end
