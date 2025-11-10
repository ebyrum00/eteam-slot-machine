module Api
  class SpinsController < ApplicationController
    def create
      player = Player.find(params[:player_id])
      spin = player.spins.create!

      # Broadcast that a spin has started (game state: spinning)
      ActionCable.server.broadcast(
        "game_updates",
        {
          event: "state_changed",
          state: "spinning",
          player_id: player.id,
          spin_id: spin.id
        }
      )

      render json: spin_json(spin), status: :created
    rescue ActiveRecord::RecordNotFound
      render json: { error: 'Player not found' }, status: :not_found
    rescue ActiveRecord::RecordInvalid => e
      render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
    end

    def show
      spin = Spin.find(params[:id])
      render json: spin_json(spin)
    rescue ActiveRecord::RecordNotFound
      render json: { error: 'Spin not found' }, status: :not_found
    end

    def apply_bonus
      spin = Spin.find(params[:id])
      spin.apply_bonus_multiplier!(params[:multiplier].to_f)

      render json: spin_json(spin)
    rescue ActiveRecord::RecordNotFound
      render json: { error: 'Spin not found' }, status: :not_found
    end

    private

    def spin_json(spin)
      {
        id: spin.id,
        player_id: spin.player_id,
        zillow_value: spin.zillow_value,
        realtor_value: spin.realtor_value,
        homes_value: spin.homes_value,
        google_value: spin.google_value,
        smart_sign_value: spin.smart_sign_value,
        banana_count: spin.banana_count,
        base_score: spin.base_score,
        bonus_multiplier: spin.bonus_multiplier&.to_f,
        total_score: spin.total_score,
        bonus_triggered: spin.bonus_triggered?,
        created_at: spin.created_at
      }
    end
  end
end
